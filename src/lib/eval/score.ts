import { DIMENSION_KEYS, DimensionKey, Fingerprint, emptyFingerprint } from "./dimensions";
import { ItemAnswer } from "./item-types";
import { scoreItem } from "./score-types";

export type ScoringOption = { dimension: string; points: number };
export type ScoringItem = { id?: string; ordinal?: number; item_type?: string; options: ScoringOption[] };

/**
 * Accumulate each item's contribution into the raw 10-dimension vector, routing
 * per item_type through `scoreItem`. Items with no `item_type` are scored as
 * Likert (the v1 default), so existing single-dimension banks and the plain
 * `Record<string, number>` answer shape keep working unchanged.
 */
export function scoreFingerprint(
  items: ScoringItem[],
  answers: Record<string, ItemAnswer>
): Fingerprint {
  const fp = emptyFingerprint();
  for (const item of items) {
    const key = String(item.id ?? item.ordinal);
    const answer = answers[key];
    if (answer === undefined || answer === null) continue;
    const contrib = scoreItem({ item_type: item.item_type ?? "likert", options: item.options }, answer);
    for (const [dim, pts] of Object.entries(contrib)) {
      if ((DIMENSION_KEYS as readonly string[]).includes(dim)) {
        fp[dim as DimensionKey] += pts;
      }
    }
  }
  return fp;
}

/**
 * Scale each dimension to 0–10 by its maximum possible points so fingerprints
 * are comparable. `maxPerDimension` is the highest attainable raw score per
 * dimension (sum of the max option points across that dimension's items).
 */
export function normalizeFingerprint(
  raw: Fingerprint,
  maxPerDimension: Partial<Record<DimensionKey, number>>
): Fingerprint {
  const out = emptyFingerprint();
  for (const k of DIMENSION_KEYS) {
    const max = maxPerDimension[k] ?? 0;
    out[k] = max > 0 ? Math.round(((raw[k] / max) * 10) * 1000) / 1000 : 0;
  }
  return out;
}

/**
 * Highest attainable raw score per dimension across the whole bank.
 * For each item, a dimension can earn at most the best points any single option
 * awards it (you pick one option), so we sum that per-item best across items.
 * Correct for single-dimension Likert AND mixed-dimension forced-choice items.
 */
export function maxPerDimensionFrom(items: (ScoringItem & { section_key?: string })[]): Record<string, number> {
  const max: Record<string, number> = {};
  for (const item of items) {
    const bestInItem: Record<string, number> = {};
    for (const o of item.options) {
      if (!o?.dimension) continue;
      bestInItem[o.dimension] = Math.max(bestInItem[o.dimension] ?? 0, o.points);
    }
    for (const [dim, pts] of Object.entries(bestInItem)) {
      if (pts > 0) max[dim] = (max[dim] ?? 0) + pts;
    }
  }
  return max;
}
