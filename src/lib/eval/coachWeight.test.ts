import { test, expect } from "vitest";
import {
  coachCredibilityWeight,
  coachInfluenceLabel,
  COACH_IQ_THRESHOLD,
  MIN_WEIGHT,
  MAX_WEIGHT,
  BASELINE_WEIGHT,
  type CoachCredibilityInput,
} from "./coachWeight";

const base: CoachCredibilityInput = {
  iqPct: null,
  level: null,
  wins: null,
  losses: null,
  yearsCoaching: null,
  championships: 0,
  titleGames: 0,
  postseason: 0,
};

test("no Coach IQ => baseline weight, even with a strong record", () => {
  const w = coachCredibilityWeight({
    ...base,
    iqPct: null,
    level: "national",
    wins: 50,
    losses: 2,
    yearsCoaching: 20,
    championships: 5,
  });
  expect(w).toBe(BASELINE_WEIGHT);
});

test("Coach IQ below threshold => baseline (gate against low-effort inflation)", () => {
  const w = coachCredibilityWeight({ ...base, iqPct: COACH_IQ_THRESHOLD - 1, level: "national", championships: 5 });
  expect(w).toBe(BASELINE_WEIGHT);
});

test("Coach IQ exactly at threshold with nothing else => baseline", () => {
  const w = coachCredibilityWeight({ ...base, iqPct: COACH_IQ_THRESHOLD });
  expect(w).toBe(BASELINE_WEIGHT);
});

test("high Coach IQ alone lifts weight above baseline", () => {
  const w = coachCredibilityWeight({ ...base, iqPct: 100 });
  expect(w).toBeGreaterThan(BASELINE_WEIGHT);
  expect(w).toBeLessThan(MAX_WEIGHT);
});

test("everything maxed => capped at MAX_WEIGHT", () => {
  const w = coachCredibilityWeight({
    iqPct: 100,
    level: "national",
    wins: 100,
    losses: 0,
    yearsCoaching: 40,
    championships: 10,
    titleGames: 10,
    postseason: 10,
  });
  expect(w).toBe(MAX_WEIGHT);
});

test("weight always within [MIN_WEIGHT, MAX_WEIGHT]", () => {
  const samples: CoachCredibilityInput[] = [
    base,
    { ...base, iqPct: 75, level: "college", wins: 10, losses: 5, yearsCoaching: 4 },
    { ...base, iqPct: 90, level: "high_school", championships: 1, postseason: 2 },
    { ...base, iqPct: 100, level: "national", wins: 30, losses: 1, yearsCoaching: 15, championships: 3, titleGames: 2 },
  ];
  for (const s of samples) {
    const w = coachCredibilityWeight(s);
    expect(w).toBeGreaterThanOrEqual(MIN_WEIGHT);
    expect(w).toBeLessThanOrEqual(MAX_WEIGHT);
  }
});

test("win% requires a minimum number of games", () => {
  const fewGames = coachCredibilityWeight({ ...base, iqPct: 80, wins: 2, losses: 0 });
  const noGames = coachCredibilityWeight({ ...base, iqPct: 80, wins: 0, losses: 0 });
  // 2 total games is below the minimum, so win% contributes nothing yet
  expect(fewGames).toBe(noGames);
});

test("a strong record above .500 increases weight (with IQ gate cleared)", () => {
  const winning = coachCredibilityWeight({ ...base, iqPct: 80, wins: 20, losses: 2 });
  const flat = coachCredibilityWeight({ ...base, iqPct: 80, wins: 11, losses: 11 });
  expect(winning).toBeGreaterThan(flat);
});

test("losing record does not drop below the .500 baseline contribution", () => {
  const losing = coachCredibilityWeight({ ...base, iqPct: 80, wins: 2, losses: 20 });
  const noRecord = coachCredibilityWeight({ ...base, iqPct: 80 });
  // below .500 contributes 0 (not negative) — never penalized below the IQ-only weight
  expect(losing).toBe(noRecord);
});

test("divide-by-zero guard: 0 wins and 0 losses is safe (no NaN)", () => {
  const w = coachCredibilityWeight({ ...base, iqPct: 80, wins: 0, losses: 0 });
  expect(Number.isFinite(w)).toBe(true);
});

test("championships count more than postseason appearances", () => {
  const champ = coachCredibilityWeight({ ...base, iqPct: 80, championships: 1 });
  const post = coachCredibilityWeight({ ...base, iqPct: 80, postseason: 1 });
  expect(champ).toBeGreaterThan(post);
});

test("national level outranks college outranks high school", () => {
  const nat = coachCredibilityWeight({ ...base, iqPct: 80, level: "national" });
  const col = coachCredibilityWeight({ ...base, iqPct: 80, level: "college" });
  const hs = coachCredibilityWeight({ ...base, iqPct: 80, level: "high_school" });
  expect(nat).toBeGreaterThan(col);
  expect(col).toBeGreaterThan(hs);
});

test("weight is rounded to 2 decimals", () => {
  const w = coachCredibilityWeight({ ...base, iqPct: 83, level: "college", wins: 13, losses: 4, yearsCoaching: 6 });
  expect(Math.round(w * 100)).toBe(w * 100);
});

test("influence label tiers track the weight", () => {
  expect(coachInfluenceLabel(1.0)).toBe("Standard");
  expect(coachInfluenceLabel(BASELINE_WEIGHT)).toBe("Standard");
  expect(["Elevated", "High"]).toContain(coachInfluenceLabel(1.5));
  expect(coachInfluenceLabel(2.0)).toBe("High");
});
