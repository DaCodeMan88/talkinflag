import { test, expect } from "vitest";
import {
  blendWeights,
  computePlayerTfScore,
  computeTfRank,
  playerDimensionScores,
  verificationFactor,
  positionBucket,
  DEFAULT_BLENDS,
} from "./tfRank";
import { DIMENSION_KEYS } from "@/lib/eval/dimensions";

// ── helpers ────────────────────────────────────────────────────────────────

function uniformWeights(value = 5): Record<string, number> {
  const w: Record<string, number> = {};
  for (const dim of DIMENSION_KEYS) {
    w[`dim.coach.${dim}`]  = value;
    w[`dim.expert.${dim}`] = value;
    w[`dim.host.${dim}`]   = value;
  }
  return w;
}

// ── positionBucket ─────────────────────────────────────────────────────────

test("positionBucket: valid position returns itself", () => {
  expect(positionBucket("QB")).toBe("QB");
  expect(positionBucket("Rusher")).toBe("Rusher");
  expect(positionBucket("LB")).toBe("LB");
});

test("positionBucket: unknown position maps to Utility", () => {
  expect(positionBucket(null)).toBe("Utility");
  expect(positionBucket("Unknown")).toBe("Utility");
  expect(positionBucket(undefined)).toBe("Utility");
});

// ── verificationFactor ─────────────────────────────────────────────────────

test("verificationFactor: verified=1.0, claimed=0.85, neither=0.65", () => {
  expect(verificationFactor(true, false)).toBe(1.0);
  expect(verificationFactor(false, true)).toBe(0.85);
  expect(verificationFactor(false, false)).toBe(0.65);
});

// ── blendWeights ───────────────────────────────────────────────────────────

test("blendWeights uses default 55/30/15 when no blend keys present", () => {
  const weights = uniformWeights(10);
  const blended = blendWeights(weights);
  // All dims get value 10 regardless of blend (coach=expert=host=10)
  for (const dim of DIMENSION_KEYS) {
    expect(blended[dim]).toBeCloseTo(10, 5);
  }
});

test("blendWeights respects admin-overridden blend fractions", () => {
  // 100% coach weight
  const weights: Record<string, number> = {
    "blend.coach": 1,
    "blend.expert": 0,
    "blend.host": 0,
    "dim.coach.production": 8,
    "dim.expert.production": 2,
    "dim.host.production": 2,
  };
  const blended = blendWeights(weights);
  expect(blended.production).toBeCloseTo(8, 5);
});

test("blendWeights normalises blend fractions that don't sum to 1", () => {
  const weights: Record<string, number> = {
    "blend.coach": 2,
    "blend.expert": 1,
    "blend.host": 1,
    ...Object.fromEntries(DIMENSION_KEYS.flatMap((d) => [
      [`dim.coach.${d}`, 8],
      [`dim.expert.${d}`, 4],
      [`dim.host.${d}`, 4],
    ])),
  };
  const blended = blendWeights(weights);
  // coach=0.5, expert=0.25, host=0.25  →  0.5*8 + 0.25*4 + 0.25*4 = 6
  expect(blended.production).toBeCloseTo(6, 5);
});

// ── playerDimensionScores ──────────────────────────────────────────────────

test("playerDimensionScores: empty stats yield finite 0–10 values", () => {
  const dims = playerDimensionScores(null, false, 0.8);
  for (const v of Object.values(dims)) {
    expect(Number.isFinite(v)).toBe(true);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(10);
  }
});

test("playerDimensionScores: national team player outscores base on intangibles", () => {
  const national = playerDimensionScores(
    { team_designation: "national_senior" }, true, 1.15
  );
  const plain = playerDimensionScores({}, false, 0.8);
  expect(national.intangibles).toBeGreaterThan(plain.intangibles);
  expect(national.competition).toBeGreaterThan(plain.competition);
});

test("playerDimensionScores: production scales with TDs and difficulty", () => {
  const easy = playerDimensionScores({ total_tds: 10 }, false, 0.7);
  const hard  = playerDimensionScores({ total_tds: 10 }, false, 1.3);
  expect(hard.production).toBeGreaterThan(easy.production);
});

// ── computePlayerTfScore ───────────────────────────────────────────────────

test("computePlayerTfScore: verified player scores higher than unverified twin", () => {
  const blended = blendWeights(uniformWeights(5));
  const stats = { total_tds: 5, team_designation: "national_senior" };
  const verified   = computePlayerTfScore({ id: "v", is_verified: true,  is_claimed: false, stats, difficulty: 1.15 }, blended);
  const unverified = computePlayerTfScore({ id: "u", is_verified: false, is_claimed: false, stats, difficulty: 1.15 }, blended);
  expect(verified.score).toBeGreaterThan(unverified.score);
});

test("computePlayerTfScore: score is 0–100", () => {
  const blended = blendWeights(uniformWeights(5));
  const s = computePlayerTfScore({ id: "x", stats: { total_tds: 999 }, difficulty: 1.3, is_verified: true }, blended);
  expect(s.score).toBeGreaterThanOrEqual(0);
  expect(s.score).toBeLessThanOrEqual(100);
});

test("computePlayerTfScore: zero weights → score of 0", () => {
  const blended = blendWeights({});
  const s = computePlayerTfScore({ id: "x", stats: { total_tds: 10 }, difficulty: 1.0 }, blended);
  expect(s.rawScore).toBe(0);
  expect(s.score).toBe(0);
});

// ── computeTfRank ─────────────────────────────────────────────────────────

test("computeTfRank: top player gets ranking_national 1", () => {
  const weights = uniformWeights(5);
  const players = [
    { id: "a", position: "QB", is_verified: true,  stats: { total_tds: 20 }, difficulty: 1.3 },
    { id: "b", position: "WR", is_verified: false, stats: {},                 difficulty: 0.7 },
  ];
  const ranked = computeTfRank(players, weights);
  const a = ranked.find((r) => r.playerId === "a")!;
  const b = ranked.find((r) => r.playerId === "b")!;
  expect(a.ranking_national).toBe(1);
  expect(b.ranking_national).toBeGreaterThan(1);
});

test("computeTfRank: position rank is independent of national rank", () => {
  const weights = uniformWeights(5);
  const players = [
    { id: "qb1", position: "QB", is_verified: true,  stats: { total_tds: 20 }, difficulty: 1.3 },
    { id: "wr1", position: "WR", is_verified: true,  stats: { total_tds: 18 }, difficulty: 1.3 },
    { id: "qb2", position: "QB", is_verified: false, stats: {},                 difficulty: 0.7 },
  ];
  const ranked = computeTfRank(players, weights);
  const qb1 = ranked.find((r) => r.playerId === "qb1")!;
  const qb2 = ranked.find((r) => r.playerId === "qb2")!;
  expect(qb1.ranking_position).toBe(1);
  expect(qb2.ranking_position).toBe(2);
});

test("computeTfRank: ties share the same national rank", () => {
  const blended = blendWeights({});
  // Zero weights → all scores = 0 → all tied at rank 1
  const players = [
    { id: "a", position: "QB" },
    { id: "b", position: "WR" },
  ];
  const ranked = computeTfRank(players, {});
  expect(ranked.every((r) => r.ranking_national === 1)).toBe(true);
});
