import { describe, it, expect } from "vitest";
import { remaining, splitEvenly, clampAllocation } from "./budget-logic";

describe("remaining", () => {
  it("returns full total for an empty allocation", () => {
    expect(remaining({})).toBe(100);
    expect(remaining({}, 50)).toBe(50);
  });

  it("subtracts the sum of values", () => {
    expect(remaining({ "0": 30, "1": 20 })).toBe(50);
  });

  it("can go negative when over-allocated", () => {
    expect(remaining({ "0": 80, "1": 40 })).toBe(-20);
  });

  it("ignores negative values (treats them as zero)", () => {
    expect(remaining({ "0": -10, "1": 30 })).toBe(70);
  });

  it("ignores non-finite values", () => {
    expect(remaining({ "0": NaN, "1": 25 })).toBe(75);
  });
});

describe("splitEvenly", () => {
  it("sums to exactly the total for n=3", () => {
    const a = splitEvenly(3);
    expect(Object.values(a).reduce((s, v) => s + v, 0)).toBe(100);
    expect(Object.keys(a)).toEqual(["0", "1", "2"]);
  });

  it("sums to exactly the total for n=4", () => {
    const a = splitEvenly(4);
    expect(Object.values(a).reduce((s, v) => s + v, 0)).toBe(100);
  });

  it("sums to exactly the total for n=5", () => {
    const a = splitEvenly(5);
    expect(Object.values(a).reduce((s, v) => s + v, 0)).toBe(100);
  });

  it("distributes the remainder to the earliest keys", () => {
    // 100 / 3 = 33 r1 -> [34, 33, 33]
    expect(splitEvenly(3)).toEqual({ "0": 34, "1": 33, "2": 33 });
  });

  it("handles n=0 and n<0 safely", () => {
    expect(splitEvenly(0)).toEqual({});
    expect(splitEvenly(-2)).toEqual({});
  });
});

describe("clampAllocation", () => {
  it("sets a value that fits within the remaining budget", () => {
    const next = clampAllocation({}, 0, 40, 3);
    expect(next["0"]).toBe(40);
  });

  it("clamps so the total never exceeds the total", () => {
    const alloc = { "0": 60, "1": 30 };
    const next = clampAllocation(alloc, 2, 50, 3);
    // 60 + 30 = 90 already used by others, so index 2 can take at most 10
    expect(next["2"]).toBe(10);
    const sum = Object.values(next).reduce((s, v) => s + v, 0);
    expect(sum).toBe(100);
    expect(sum).toBeLessThanOrEqual(100);
  });

  it("never lets the total exceed total even when raising an existing value", () => {
    const alloc = { "0": 20, "1": 20 };
    const next = clampAllocation(alloc, 0, 95, 3);
    // others use 20, so index 0 caps at 80
    expect(next["0"]).toBe(80);
    expect(Object.values(next).reduce((s, v) => s + v, 0)).toBeLessThanOrEqual(100);
  });

  it("clamps negatives up to 0", () => {
    const next = clampAllocation({ "0": 30 }, 0, -5, 3);
    expect(next["0"]).toBe(0);
  });

  it("does not mutate the input allocation", () => {
    const alloc = { "0": 10 };
    clampAllocation(alloc, 1, 50, 3);
    expect(alloc).toEqual({ "0": 10 });
  });
});
