import { test, expect } from "vitest";
import { buildPlayerVector, offenseRaw, POS_WEIGHT } from "./profile";
import { similarityScore } from "./similar";

const maxes = { offense: 20, defense: 10, bigGame: 10 };

test("position one-hot is weighted", () => {
  const v = buildPlayerVector({ position: "QB", gender: "female", stats: {} }, 1.0, maxes);
  expect(v[0]).toBe(POS_WEIGHT);
  expect(v[1]).toBe(0);
});

test("league difficulty scales identical production", () => {
  const stats = { td_passes: 10 }; // offenseRaw = 10
  expect(offenseRaw(stats)).toBe(10);
  const easy = buildPlayerVector({ position: "QB", gender: "female", stats }, 1.0, maxes);
  const hard = buildPlayerVector({ position: "QB", gender: "female", stats }, 1.3, maxes);
  expect(easy[7]).toBeCloseTo(0.5, 3);   // 10*1.0/20
  expect(hard[7]).toBeCloseTo(0.65, 3);  // 10*1.3/20
  expect(hard[7]).toBeGreaterThan(easy[7]);
});

test("missing stats yield 0, never NaN", () => {
  const v = buildPlayerVector({ position: "DB", gender: "male", stats: null }, 0.7, maxes);
  expect(v.every((x) => Number.isFinite(x))).toBe(true);
  expect(v[7]).toBe(0);
  expect(v[6]).toBe(1); // male
  expect(v[2]).toBe(POS_WEIGHT); // DB
});

test("similarityScore is monotonic and bounded", () => {
  expect(similarityScore(0)).toBe(100);
  expect(similarityScore(1)).toBe(50);
  expect(similarityScore(4)).toBe(20);
  expect(similarityScore(10)).toBeLessThan(similarityScore(2));
});
