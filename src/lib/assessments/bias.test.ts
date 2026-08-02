import { describe, it, expect } from "vitest";
import { positionBias, longestChoiceBias, chiSquareUniform } from "./bias";

const q = (choices: string[], correct_index: number) => ({ choices, correct_index });

describe("positionBias", () => {
  it("reports the share of keys at each index", () => {
    const r = positionBias([q(["a","b","c","d"], 1), q(["a","b","c","d"], 1), q(["a","b","c","d"], 0)]);
    expect(r.counts).toEqual([1, 2, 0, 0]);
    expect(r.maxShare).toBeCloseTo(0.667, 2);
  });
});

describe("longestChoiceBias", () => {
  it("counts how often the key is the longest string", () => {
    const r = longestChoiceBias([
      q(["short", "a much longer correct answer"], 1),
      q(["short", "tiny"], 0),
    ]);
    expect(r.hits).toBe(1);
    expect(r.share).toBe(0.5);
  });
});

describe("chiSquareUniform", () => {
  it("is ~0 for a uniform distribution", () => {
    expect(chiSquareUniform([10, 10, 10, 10])).toBeCloseTo(0, 5);
  });
  it("is large for a degenerate one", () => {
    expect(chiSquareUniform([40, 0, 0, 0])).toBeGreaterThan(50);
  });
});
