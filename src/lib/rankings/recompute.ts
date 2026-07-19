// Server-only recompute pipeline for TF Rank.
// Correct order:
//   1. Rebuild player vectors (league-adjusted KNN profile_vector)
//   2. Aggregate eval role weights from eval_responses
//   3. computeCohortRanks → per-cohort national + position ordinals
//   4. Write ranks back to players table
//   5. Snapshot to ranking_snapshots

import { createAdminClient } from "@/lib/eval/admin-client";
import { aggregateRoleWeights, aggregateRoleWeightsWeighted } from "@/lib/eval/aggregate";
import type { Fingerprint } from "@/lib/eval/dimensions";
import { DIMENSION_KEYS } from "@/lib/eval/dimensions";
import { loadCoachCredibility } from "@/lib/eval/coachCredibility";
import { BASELINE_WEIGHT } from "@/lib/eval/coachWeight";
import { buildPlayerVector } from "@/lib/knn/profile";
import { computeCohortRanks } from "./tfRank";

type Role = "coach" | "expert" | "host";
const ROLES: Role[] = ["coach", "expert", "host"];

// ── Step 1: Rebuild player profile vectors ─────────────────────────────────

async function rebuildPlayerVectors(db: ReturnType<typeof createAdminClient>) {
  const { data: players } = await db
    .from("players")
    .select("id, position, gender, stats, league_key");
  if (!players?.length) return;

  const { data: leagues } = await db.from("league_difficulty").select("league_key, difficulty");
  const diffMap = Object.fromEntries((leagues ?? []).map((l) => [l.league_key, l.difficulty]));

  // Compute league-wide maxima for normalisation
  let maxOffense = 0; let maxDefense = 0; let maxBigGame = 0;
  const { offenseRaw, defenseRaw, bigGameRaw } = await import("@/lib/knn/profile");
  for (const p of players) {
    const diff = diffMap[p.league_key ?? "other"] ?? 0.8;
    maxOffense = Math.max(maxOffense, offenseRaw(p.stats) * diff);
    maxDefense = Math.max(maxDefense, defenseRaw(p.stats) * diff);
    maxBigGame = Math.max(maxBigGame, bigGameRaw(p.stats) * diff);
  }
  if (maxOffense === 0) maxOffense = 1;
  if (maxDefense === 0) maxDefense = 1;
  if (maxBigGame === 0) maxBigGame = 1;
  const maxes = { offense: maxOffense, defense: maxDefense, bigGame: maxBigGame };

  const updates = players.map((p) => ({
    id: p.id,
    profile_vector: buildPlayerVector(p, diffMap[p.league_key ?? "other"] ?? 0.8, maxes),
    profile_built_at: new Date().toISOString(),
  }));

  // Partial-column upsert is impossible on players (NOT NULL first/last name are
  // checked before ON CONFLICT), so write back with real UPDATEs, batched.
  for (let i = 0; i < updates.length; i += 25) {
    const chunk = updates.slice(i, i + 25);
    const results = await Promise.all(
      chunk.map(({ id, ...fields }) =>
        db.from("players").update(fields).eq("id", id),
      ),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      throw new Error(`player vector update failed: ${failed.error.message}`);
    }
  }
}

// ── Step 2: Aggregate eval responses → ranking_weights ────────────────────

async function recomputeEvalWeights(db: ReturnType<typeof createAdminClient>) {
  // Load all approved eval responses grouped by role. user_id lets us weight
  // coach votes by each coach's credibility.
  const { data: responses } = await db
    .from("eval_responses")
    .select("role_at_submit, fingerprint, user_id");
  if (!responses?.length) return;

  const expertHost: Record<"expert" | "host", Fingerprint[]> = { expert: [], host: [] };
  const coachEntries: { fingerprint: Fingerprint; userId: string | null }[] = [];
  for (const r of responses) {
    const role = r.role_at_submit as Role;
    if (role === "coach") {
      coachEntries.push({ fingerprint: r.fingerprint as Fingerprint, userId: (r.user_id as string | null) ?? null });
    } else if (role === "expert" || role === "host") {
      expertHost[role].push(r.fingerprint as Fingerprint);
    }
  }

  // Coach role: weight each vote by the coach's credibility (Coach IQ +
  // level + win% + experience + championships/postseason). A coach with no
  // verified row or sub-threshold IQ contributes at BASELINE_WEIGHT.
  const credibility = await loadCoachCredibility(
    db,
    coachEntries.map((e) => e.userId).filter((id): id is string => !!id)
  );
  const coachWeighted = coachEntries.map((e) => ({
    fingerprint: e.fingerprint,
    weight: (e.userId && credibility.get(e.userId)?.weight) || BASELINE_WEIGHT,
  }));

  const aggByRole: Record<Role, Fingerprint> = {
    coach: aggregateRoleWeightsWeighted(coachWeighted),
    expert: aggregateRoleWeights(expertHost.expert),
    host: aggregateRoleWeights(expertHost.host),
  };

  const upserts = [];
  for (const role of ROLES) {
    const agg = aggByRole[role];
    for (const dim of DIMENSION_KEYS) {
      upserts.push({
        key: `dim.${role}.${dim}`,
        value: agg[dim],
        source: "aggregate" as const,
        updated_at: new Date().toISOString(),
      });
    }
  }
  if (upserts.length) {
    await db.from("ranking_weights").upsert(upserts, { onConflict: "key" });
  }
}

// ── Step 3–5: Score players → write ranks + snapshot ─────────────────────

async function scoreAndWriteRanks(db: ReturnType<typeof createAdminClient>) {
  const [{ data: players }, { data: rawWeights }] = await Promise.all([
    db.from("players").select("id, position, level, is_verified, is_claimed, stats, league_key"),
    db.from("ranking_weights").select("key, value"),
  ]);

  if (!players?.length) return { rankedCount: 0 };

  const { data: leagues } = await db.from("league_difficulty").select("league_key, difficulty");
  const diffMap = Object.fromEntries((leagues ?? []).map((l) => [l.league_key, l.difficulty]));

  const weightMap: Record<string, number> = {};
  for (const w of rawWeights ?? []) weightMap[w.key] = Number(w.value);

  const playersWithDifficulty = players.map((p) => ({
    ...p,
    difficulty: diffMap[p.league_key ?? "other"] ?? 0.8,
  }));

  const ranked = computeCohortRanks(playersWithDifficulty, weightMap);

  // Write back to players table
  const updates = ranked.map((r) => ({
    id: r.playerId,
    ranking_national: r.ranking_national,
    ranking_position: r.ranking_position,
    updated_at: new Date().toISOString(),
  }));

  // Partial-column upsert is impossible on players (NOT NULL first/last name are
  // checked before ON CONFLICT), so write back with real UPDATEs, batched.
  for (let i = 0; i < updates.length; i += 25) {
    const chunk = updates.slice(i, i + 25);
    const results = await Promise.all(
      chunk.map(({ id, ...fields }) =>
        db.from("players").update(fields).eq("id", id),
      ),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      throw new Error(`players rank update failed: ${failed.error.message}`);
    }
  }

  // Snapshot (top 100 per cohort by score)
  const snapshotRows = (["hs", "cw"] as const).flatMap((cohort) =>
    ranked
      .filter((r) => r.cohort === cohort)
      .sort((a, b) => a.ranking_national - b.ranking_national)
      .slice(0, 100)
      .map((r) => ({
        player_id: r.playerId,
        cohort: r.cohort,
        ranking_national: r.ranking_national,
        ranking_position: r.ranking_position,
        tf_score: r.score,
        position_bucket: r.positionBucket,
        dim_scores: r.dimScores,
        verification_factor: r.verificationFactor,
        snapshotted_at: new Date().toISOString(),
      })),
  );
  if (snapshotRows.length) {
    const { error } = await db.from("ranking_snapshots").insert(snapshotRows);
    if (error) throw new Error(`ranking snapshot insert failed: ${error.message}`);
  }

  return { rankedCount: ranked.length };
}

// ── Public entry point ────────────────────────────────────────────────────

export async function runRecompute(): Promise<{ ok: boolean; rankedCount: number; error?: string }> {
  const db = createAdminClient();
  try {
    await rebuildPlayerVectors(db);
    await recomputeEvalWeights(db);
    const { rankedCount } = await scoreAndWriteRanks(db);
    return { ok: true, rankedCount };
  } catch (err) {
    return { ok: false, rankedCount: 0, error: String(err) };
  }
}
