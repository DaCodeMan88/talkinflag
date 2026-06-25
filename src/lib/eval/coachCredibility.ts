// Server-side loader that assembles coachCredibilityWeight inputs from the
// database (coaches row + best Coach IQ + approved career updates) and returns
// the resulting voting-influence weights. Kept separate from coachWeight.ts so
// that file stays pure/I-O-free and unit-tested.

import type { createAdminClient } from "./admin-client";
import {
  coachCredibilityWeight,
  type CoachCredibilityInput,
  BASELINE_WEIGHT,
} from "./coachWeight";

type Db = ReturnType<typeof createAdminClient>;

export type CoachCredibility = { input: CoachCredibilityInput; weight: number };

const ACHIEVEMENT_KINDS = ["championship", "title_game", "postseason"] as const;

/**
 * For each given coach user_id, load credibility inputs and compute the voting
 * weight. Users with no verified coach row are omitted from the map (callers
 * treat a missing entry as the BASELINE_WEIGHT). Empty input → empty map.
 */
export async function loadCoachCredibility(
  db: Db,
  userIds: string[]
): Promise<Map<string, CoachCredibility>> {
  const out = new Map<string, CoachCredibility>();
  const ids = [...new Set(userIds.filter(Boolean))];
  if (ids.length === 0) return out;

  const [coachesRes, iqRes, updatesRes] = await Promise.all([
    db
      .from("coaches")
      .select("user_id, level, wins, losses, years_coaching")
      .in("user_id", ids)
      .eq("is_verified", true),
    db
      .from("iq_best")
      .select("user_id, score_pct")
      .eq("category", "coach")
      .in("user_id", ids),
    db
      .from("career_updates")
      .select("subject_user_id, kind")
      .eq("role", "coach")
      .eq("status", "approved")
      .in("subject_user_id", ids)
      .in("kind", ACHIEVEMENT_KINDS as unknown as string[]),
  ]);

  const iqByUser = new Map<string, number>();
  for (const r of iqRes.data ?? []) {
    iqByUser.set(r.user_id as string, Number(r.score_pct));
  }

  type Counts = { championships: number; titleGames: number; postseason: number };
  const countsByUser = new Map<string, Counts>();
  for (const r of updatesRes.data ?? []) {
    const uid = r.subject_user_id as string;
    const c = countsByUser.get(uid) ?? { championships: 0, titleGames: 0, postseason: 0 };
    if (r.kind === "championship") c.championships += 1;
    else if (r.kind === "title_game") c.titleGames += 1;
    else if (r.kind === "postseason") c.postseason += 1;
    countsByUser.set(uid, c);
  }

  for (const coach of coachesRes.data ?? []) {
    const uid = coach.user_id as string;
    if (!uid) continue;
    const counts = countsByUser.get(uid) ?? { championships: 0, titleGames: 0, postseason: 0 };
    const input: CoachCredibilityInput = {
      iqPct: iqByUser.has(uid) ? (iqByUser.get(uid) as number) : null,
      level: (coach.level as string | null) ?? null,
      wins: coach.wins as number | null,
      losses: coach.losses as number | null,
      yearsCoaching: coach.years_coaching as number | null,
      championships: counts.championships,
      titleGames: counts.titleGames,
      postseason: counts.postseason,
    };
    out.set(uid, { input, weight: coachCredibilityWeight(input) });
  }

  return out;
}

/** Single-coach convenience for profile/admin surfaces. */
export async function loadOneCoachCredibility(
  db: Db,
  userId: string | null | undefined
): Promise<CoachCredibility | null> {
  if (!userId) return null;
  const map = await loadCoachCredibility(db, [userId]);
  return map.get(userId) ?? null;
}

export { BASELINE_WEIGHT };
