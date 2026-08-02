import { describe, it, expect } from "vitest";
import { percentileOf, hasEnoughSamples } from "./percentile";

describe("percentileOf", () => {
  it("returns null for an empty sample", () => {
    expect(percentileOf(50, [])).toBeNull();
  });

  it("returns 100 for a single-element sample equal to the value", () => {
    // The lone taker is at or below their own score → 100th percentile.
    expect(percentileOf(50, [50])).toBe(100);
  });

  it("returns 100 when every sample value is below the value", () => {
    expect(percentileOf(50, [10, 20, 30])).toBe(100);
  });

  it("returns 0 when every sample value is above the value", () => {
    expect(percentileOf(50, [80, 90, 100])).toBe(0);
  });

  it("counts ties (inclusive <=)", () => {
    expect(percentileOf(50, [50, 50, 50])).toBe(100);
  });

  it("computes a mixed distribution to one decimal", () => {
    // 2 of 3 are <= 50 → 66.666… → 66.7
    expect(percentileOf(50, [50, 50, 60])).toBe(66.7);
  });

  it("handles a value strictly between sample points", () => {
    // <= 55: 40 and 50 → 2 of 4 = 50.0
    expect(percentileOf(55, [40, 50, 60, 70])).toBe(50);
  });
});

describe("hasEnoughSamples", () => {
  it("is false below the default minimum", () => {
    expect(hasEnoughSamples(19)).toBe(false);
  });

  it("is true at the default minimum", () => {
    expect(hasEnoughSamples(20)).toBe(true);
  });

  it("is false for zero", () => {
    expect(hasEnoughSamples(0)).toBe(false);
  });

  it("respects a custom minimum", () => {
    expect(hasEnoughSamples(5, 5)).toBe(true);
    expect(hasEnoughSamples(4, 5)).toBe(false);
  });
});
