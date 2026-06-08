import { test, expect } from "vitest";
import { scoreFingerprint, normalizeFingerprint, maxPerDimensionFrom } from "./score";
import { classifyArchetype } from "./archetype";
import { scienceRollup, idealGap } from "./science";
import { aggregateRoleWeights } from "./aggregate";
import { emptyFingerprint } from "./dimensions";

test("scoreFingerprint sums chosen option points per dimension", () => {
  const items = [
    { ordinal: 1, options: [
      { label: "Not at all", dimension: "defense", points: 0 },
      { label: "Decisive", dimension: "defense", points: 4 },
    ] },
    { ordinal: 2, options: [
      { label: "Stats monster", dimension: "production", points: 4 },
      { label: "Title-game steady", dimension: "clutch", points: 4 },
    ] },
  ];
  const fp = scoreFingerprint(items, { "1": 1, "2": 1 }); // 1→defense 4, 2→clutch 4
  expect(fp.defense).toBe(4);
  expect(fp.clutch).toBe(4);
  expect(fp.production).toBe(0);
});

test("scoreFingerprint ignores unanswered items", () => {
  const items = [{ ordinal: 1, options: [{ label: "a", dimension: "clutch", points: 3 }] }];
  expect(scoreFingerprint(items, {}).clutch).toBe(0);
});

test("normalizeFingerprint scales each dimension to 0-10", () => {
  const raw = { ...emptyFingerprint(), defense: 4, clutch: 8 };
  const n = normalizeFingerprint(raw, { defense: 8, clutch: 8 });
  expect(n.defense).toBe(5); // 4/8*10
  expect(n.clutch).toBe(10);
});

test("normalizeFingerprint guards divide-by-zero", () => {
  const raw = { ...emptyFingerprint(), defense: 4 };
  expect(normalizeFingerprint(raw, {}).defense).toBe(0);
});

test("maxPerDimensionFrom sums max option points per dimension", () => {
  const items = [
    { section_key: "clutch", options: [{ label: "a", dimension: "clutch", points: 0 }, { label: "b", dimension: "clutch", points: 4 }] },
    { section_key: "clutch", options: [{ label: "a", dimension: "clutch", points: 0 }, { label: "b", dimension: "clutch", points: 4 }] },
  ];
  expect(maxPerDimensionFrom(items).clutch).toBe(8);
});

test("classifyArchetype: IQ+defense heavy => Film-Room Evaluator", () => {
  const fp = { ...emptyFingerprint(), football_iq: 10, defense: 9, versatility: 8 };
  expect(classifyArchetype(fp).name).toBe("Film-Room Evaluator");
});

test("classifyArchetype: production heavy => Numbers Purist", () => {
  const fp = { ...emptyFingerprint(), production: 10, athleticism: 8, competition: 7 };
  expect(classifyArchetype(fp).name).toBe("Numbers Purist");
});

test("scienceRollup averages mapped dimensions", () => {
  const fp = { ...emptyFingerprint(), athleticism: 8, football_iq: 6, consistency: 2 };
  const roll = scienceRollup(fp, { athleticism: "S5", football_iq: "S1", consistency: "S6" });
  expect(roll.S5).toBe(8);
  expect(roll.S1).toBe(6);
  expect(roll.S6).toBe(2);
});

test("idealGap flags the largest over- and under-weighted dimensions", () => {
  // member over-weights physical (athleticism), under-weights clutch vs ideal
  const member = { "dim.athleticism": 10, "dim.clutch": 2 };
  const ideal = { "dim.athleticism": 3, "dim.clutch": 10 };
  const { mostOver, mostUnder } = idealGap(member, ideal);
  expect(mostOver?.key).toBe("dim.athleticism");
  expect(mostUnder?.key).toBe("dim.clutch");
});

test("aggregateRoleWeights returns element-wise mean", () => {
  const a = { ...emptyFingerprint(), clutch: 10, athleticism: 2 };
  const b = { ...emptyFingerprint(), clutch: 6, athleticism: 4 };
  const agg = aggregateRoleWeights([a, b]);
  expect(agg.clutch).toBe(8);
  expect(agg.athleticism).toBe(3);
});

test("aggregateRoleWeights handles empty input", () => {
  expect(aggregateRoleWeights([]).clutch).toBe(0);
});
