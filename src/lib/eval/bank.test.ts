import { describe, it, expect } from "vitest";
import bank from "../../../scripts/data/eval-items-v2.json";
import { DIMENSION_KEYS } from "./dimensions";

const items = bank.items as Array<{
  ordinal: number; prompt: string; item_type: string; round: number;
  options: { label: string; dimension: string; points: number }[];
  taxonomy_tier: number; science_dimension: string | null;
}>;

describe("eval bank v2", () => {
  it("has 28 items with unique, contiguous ordinals", () => {
    expect(items).toHaveLength(28);
    expect([...new Set(items.map((i) => i.ordinal))]).toHaveLength(28);
    expect(items.map((i) => i.ordinal).sort((a, b) => a - b)).toEqual([...Array(28).keys()].map((n) => n + 1));
  });
  it("uses all five item types with the planned mix", () => {
    const byType = items.reduce<Record<string, number>>((a, i) => ({ ...a, [i.item_type]: (a[i.item_type] ?? 0) + 1 }), {});
    expect(byType).toEqual({ forced_choice: 6, budget: 2, scenario: 6, rank: 4, likert: 10 });
  });
  it("never repeats a question stem", () => {
    expect(new Set(items.map((i) => i.prompt.trim().toLowerCase())).size).toBe(28);
  });
  it("has retired the old boilerplate stem entirely", () => {
    expect(items.filter((i) => /how much does it matter/i.test(i.prompt))).toHaveLength(0);
  });
  it("reuses no answer-anchor set more than twice", () => {
    const counts = new Map<string, number>();
    for (const i of items) {
      const k = i.options.map((o) => o.label).join("|");
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    expect([...counts.values()].every((n) => n <= 2)).toBe(true);
  });
  it("makes forced_choice a genuine tradeoff: distinct dimensions, equal points", () => {
    for (const i of items.filter((x) => x.item_type === "forced_choice")) {
      const dims = i.options.map((o) => o.dimension);
      expect(new Set(dims).size).toBe(dims.length);
      expect(new Set(i.options.map((o) => o.points)).size).toBe(1);
    }
  });
  it("scores every dimension in at least 5 items", () => {
    for (const d of DIMENSION_KEYS) {
      const n = items.filter((i) => i.options.some((o) => o.dimension === d && o.points > 0)).length;
      expect(n, `${d} appears in only ${n} items`).toBeGreaterThanOrEqual(5);
    }
  });
  it("keeps the taxonomy fields the reference vector depends on", () => {
    for (const i of items) expect(i.taxonomy_tier).toBeGreaterThanOrEqual(1);
  });
  it("assigns every item to a round 1-5", () => {
    expect(items.every((i) => i.round >= 1 && i.round <= 5)).toBe(true);
  });
});
