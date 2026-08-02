import { describe, it, expect } from "vitest";
import { permutationFor, applyPermutation, invertChoice } from "./shuffle";

describe("permutationFor", () => {
  it("is deterministic for the same nonce + item", () => {
    expect(permutationFor("n1", "item-a", 4)).toEqual(permutationFor("n1", "item-a", 4));
  });

  it("differs across items and across nonces", () => {
    const a = permutationFor("n1", "item-a", 5);
    const b = permutationFor("n1", "item-b", 5);
    const c = permutationFor("n2", "item-a", 5);
    expect(a).not.toEqual(b);
    expect(a).not.toEqual(c);
  });

  it("is always a true permutation of 0..n-1", () => {
    for (const n of [2, 3, 4, 5, 9]) {
      const p = permutationFor("seed", `i${n}`, n);
      expect([...p].sort((x, y) => x - y)).toEqual([...Array(n).keys()]);
    }
  });
});

describe("applyPermutation / invertChoice", () => {
  it("round-trips a chosen display index back to the stored index", () => {
    const options = ["a", "b", "c", "d"];
    const perm = permutationFor("n1", "item-a", 4);
    const shown = applyPermutation(options, perm);
    for (let displayed = 0; displayed < 4; displayed++) {
      const stored = invertChoice(perm, displayed);
      expect(options[stored]).toBe(shown[displayed]);
    }
  });

  it("returns -1 for an out-of-range displayed index", () => {
    expect(invertChoice(permutationFor("n", "i", 4), 9)).toBe(-1);
    expect(invertChoice(permutationFor("n", "i", 4), -1)).toBe(-1);
  });
});
