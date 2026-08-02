import { describe, it, expect } from "vitest";
import { classifyArchetype } from "./archetype";
import { DIMENSION_KEYS, Fingerprint } from "./dimensions";

const fp = (partial: Partial<Record<string, number>>): Fingerprint =>
  Object.fromEntries(DIMENSION_KEYS.map((k) => [k, partial[k] ?? 5])) as Fingerprint;

describe("classifyArchetype", () => {
  it("labels a flat max-everything vector Balanced Evaluator, not a random archetype", () => {
    // This is a REAL production fingerprint (eval_responses row 1), which the
    // old Euclidean classifier mislabeled 'Athlete-First Scout'.
    const flat = fp({ clutch: 10, defense: 10, production: 9, athleticism: 10, ball_skills: 9.75,
                      competition: 9, consistency: 9, football_iq: 10, intangibles: 10, versatility: 10 });
    expect(classifyArchetype(flat).name).toBe("Balanced Evaluator");
  });

  it("matches on shape, independent of overall magnitude", () => {
    // All ten dims specified (no constant default-fill), so `high` is a true
    // scalar multiple of `low` — same shape, different magnitude. Cosine of the
    // mean-centered vectors is scale-invariant, so both must land identically.
    const shape: Record<string, number> = {
      football_iq: 8, defense: 7, versatility: 6, ball_skills: 5,
      athleticism: 3, production: 2, clutch: 4, competition: 4,
      intangibles: 4, consistency: 4,
    };
    const low = fp(shape);
    const high = fp(Object.fromEntries(Object.entries(shape).map(([k, v]) => [k, v * 1.2])));
    expect(classifyArchetype(low).name).toBe("Film-Room Evaluator");
    expect(classifyArchetype(high).name).toBe(classifyArchetype(low).name);
  });

  it("still separates genuinely different emphases", () => {
    const numbers = fp({ production: 10, athleticism: 8, competition: 7, football_iq: 2, intangibles: 2 });
    expect(classifyArchetype(numbers).name).toBe("Numbers Purist");
  });
});
