import { describe, it, expect } from "vitest";
import { nextStreak, bestStreak } from "./streak";

describe("nextStreak", () => {
  it("increments on a correct answer", () => {
    expect(nextStreak(0, true)).toBe(1);
    expect(nextStreak(3, true)).toBe(4);
  });

  it("resets to 0 on a wrong answer", () => {
    expect(nextStreak(0, false)).toBe(0);
    expect(nextStreak(5, false)).toBe(0);
  });
});

describe("bestStreak", () => {
  it("is 0 for an empty history", () => {
    expect(bestStreak([])).toBe(0);
  });

  it("counts a run of all-correct as the full length", () => {
    expect(bestStreak([true, true, true, true])).toBe(4);
  });

  it("is 0 when everything is wrong", () => {
    expect(bestStreak([false, false, false])).toBe(0);
  });

  it("returns the LONGEST run in a mixed history", () => {
    // runs: 2, then 3 -> best 3
    expect(bestStreak([true, true, false, true, true, true, false])).toBe(3);
  });

  it("resets the run on each miss", () => {
    expect(bestStreak([true, false, true, false, true])).toBe(1);
  });

  it("handles a run that ends at the last item", () => {
    expect(bestStreak([false, true, true])).toBe(2);
  });
});
