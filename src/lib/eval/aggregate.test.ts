import { test, expect } from "vitest";
import { aggregateRoleWeights, aggregateRoleWeightsWeighted } from "./aggregate";
import { emptyFingerprint } from "./dimensions";

test("aggregateRoleWeightsWeighted with equal weights equals the plain mean", () => {
  const a = { ...emptyFingerprint(), clutch: 10, athleticism: 2 };
  const b = { ...emptyFingerprint(), clutch: 6, athleticism: 4 };
  const plain = aggregateRoleWeights([a, b]);
  const weighted = aggregateRoleWeightsWeighted([
    { fingerprint: a, weight: 1 },
    { fingerprint: b, weight: 1 },
  ]);
  expect(weighted.clutch).toBe(plain.clutch);
  expect(weighted.athleticism).toBe(plain.athleticism);
});

test("aggregateRoleWeightsWeighted skews toward the higher-weight fingerprint", () => {
  const a = { ...emptyFingerprint(), clutch: 10 };
  const b = { ...emptyFingerprint(), clutch: 0 };
  const weighted = aggregateRoleWeightsWeighted([
    { fingerprint: a, weight: 3 },
    { fingerprint: b, weight: 1 },
  ]);
  // weighted mean = (10*3 + 0*1) / 4 = 7.5
  expect(weighted.clutch).toBe(7.5);
});

test("aggregateRoleWeightsWeighted handles empty input", () => {
  expect(aggregateRoleWeightsWeighted([]).clutch).toBe(0);
});

test("aggregateRoleWeightsWeighted returns zeros when total weight is 0", () => {
  const a = { ...emptyFingerprint(), clutch: 10 };
  expect(aggregateRoleWeightsWeighted([{ fingerprint: a, weight: 0 }]).clutch).toBe(0);
});
