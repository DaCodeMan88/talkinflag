import { describe, it, expect } from "vitest";
import { move, togglePlace } from "./rank-logic";

describe("move", () => {
  it("swaps an element up with its neighbour", () => {
    expect(move([0, 1, 2, 3], 2, -1)).toEqual([0, 2, 1, 3]);
  });

  it("swaps an element down with its neighbour", () => {
    expect(move([0, 1, 2, 3], 1, 1)).toEqual([0, 2, 1, 3]);
  });

  it("is a no-op moving the first element up", () => {
    expect(move([0, 1, 2], 0, -1)).toEqual([0, 1, 2]);
  });

  it("is a no-op moving the last element down", () => {
    expect(move([0, 1, 2], 2, 1)).toEqual([0, 1, 2]);
  });

  it("is a no-op for an out-of-range index", () => {
    expect(move([0, 1, 2], 5, 1)).toEqual([0, 1, 2]);
    expect(move([0, 1, 2], -1, -1)).toEqual([0, 1, 2]);
  });

  it("does not mutate the input", () => {
    const order = [0, 1, 2];
    move(order, 1, 1);
    expect(order).toEqual([0, 1, 2]);
  });
});

describe("togglePlace", () => {
  it("appends an option index that is not yet placed", () => {
    expect(togglePlace([], 2)).toEqual([2]);
    expect(togglePlace([2, 0], 1)).toEqual([2, 0, 1]);
  });

  it("removes an option index that is already placed", () => {
    expect(togglePlace([2, 0, 1], 0)).toEqual([2, 1]);
  });

  it("adds then removes back to empty", () => {
    const added = togglePlace([], 3);
    expect(added).toEqual([3]);
    expect(togglePlace(added, 3)).toEqual([]);
  });

  it("does not mutate the input", () => {
    const order = [0, 1];
    togglePlace(order, 2);
    expect(order).toEqual([0, 1]);
  });
});
