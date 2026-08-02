import { describe, it, expect } from "vitest";
import { roundBoundaries, chunkByRound, roundProgress, fixedChunks } from "./rounds";

describe("roundBoundaries", () => {
  it("returns indices where a new round begins after the first", () => {
    expect(roundBoundaries([1, 1, 2, 2, 3])).toEqual([2, 4]);
  });

  it("returns [] for a single round", () => {
    expect(roundBoundaries([1, 1, 1])).toEqual([]);
  });

  it("returns [] for empty input", () => {
    expect(roundBoundaries([])).toEqual([]);
  });

  it("handles a boundary at every step", () => {
    expect(roundBoundaries([1, 2, 3])).toEqual([1, 2]);
  });

  it("keys off change of value, not magnitude/order", () => {
    expect(roundBoundaries([2, 2, 5, 5, 1])).toEqual([2, 4]);
  });
});

describe("chunkByRound", () => {
  it("splits into contiguous runs with exclusive end", () => {
    expect(chunkByRound([1, 1, 2])).toEqual([
      { round: 1, start: 0, end: 2 },
      { round: 2, start: 2, end: 3 },
    ]);
  });

  it("returns [] for empty input", () => {
    expect(chunkByRound([])).toEqual([]);
  });

  it("returns a single chunk when all one round", () => {
    expect(chunkByRound([3, 3, 3, 3])).toEqual([{ round: 3, start: 0, end: 4 }]);
  });

  it("handles five distinct rounds", () => {
    expect(chunkByRound([1, 1, 2, 2, 3, 4, 5])).toEqual([
      { round: 1, start: 0, end: 2 },
      { round: 2, start: 2, end: 4 },
      { round: 3, start: 4, end: 5 },
      { round: 4, start: 5, end: 6 },
      { round: 5, start: 6, end: 7 },
    ]);
  });
});

describe("roundProgress", () => {
  const chunks = chunkByRound([1, 1, 2, 2, 3]);

  it("reports the round for the first item", () => {
    expect(roundProgress(0, chunks)).toEqual({ current: 1, total: 3, withinIndex: 0, withinTotal: 2 });
  });

  it("reports position within a mid round", () => {
    expect(roundProgress(3, chunks)).toEqual({ current: 2, total: 3, withinIndex: 1, withinTotal: 2 });
  });

  it("reports the last round", () => {
    expect(roundProgress(4, chunks)).toEqual({ current: 3, total: 3, withinIndex: 0, withinTotal: 1 });
  });

  it("clamps an out-of-range index to the last round", () => {
    expect(roundProgress(99, chunks)).toEqual({ current: 3, total: 3, withinIndex: 0, withinTotal: 1 });
  });

  it("is safe for empty chunks", () => {
    expect(roundProgress(0, [])).toEqual({ current: 1, total: 1, withinIndex: 0, withinTotal: 0 });
  });
});

describe("fixedChunks", () => {
  it("splits 40 items into rounds of 10", () => {
    expect(fixedChunks(40, 10)).toEqual([
      { round: 1, start: 0, end: 10 },
      { round: 2, start: 10, end: 20 },
      { round: 3, start: 20, end: 30 },
      { round: 4, start: 30, end: 40 },
    ]);
  });

  it("splits 32 items into rounds of 8", () => {
    expect(fixedChunks(32, 8)).toEqual([
      { round: 1, start: 0, end: 8 },
      { round: 2, start: 8, end: 16 },
      { round: 3, start: 16, end: 24 },
      { round: 4, start: 24, end: 32 },
    ]);
  });

  it("makes the last chunk short when uneven", () => {
    expect(fixedChunks(25, 10)).toEqual([
      { round: 1, start: 0, end: 10 },
      { round: 2, start: 10, end: 20 },
      { round: 3, start: 20, end: 25 },
    ]);
  });

  it("returns one chunk when total <= size", () => {
    expect(fixedChunks(6, 10)).toEqual([{ round: 1, start: 0, end: 6 }]);
  });

  it("returns [] for zero items", () => {
    expect(fixedChunks(0, 10)).toEqual([]);
  });
});
