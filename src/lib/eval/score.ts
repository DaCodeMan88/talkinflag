import { DIMENSION_KEYS, DimensionKey, Fingerprint, emptyFingerprint } from "./dimensions";

export type ScoringOption = { dimension: string; points: number };
export type ScoringItem = { id?: string; ordinal?: number; options: ScoringOption[] };

/**
 * Sum each chosen option's points into its dimension.
 * `answers` maps an item key (id or ordinal) to the chosen option index.
 * Returns the raw 10-dimension vector (un-normalized).
 */
export function scoreFingerprint(
  items: ScoringItem[],
  answers: Record<string, number>
): Fingerprint {
  const fp = emptyFingerprint();
  for (const item of items) {
    const key = String(item.id ?? item.ordinal);
    const chosen = answers[key];
    if (chosen === undefined || chosen === null) continue;
    const opt = item.options[chosen];
    if (!opt) continue;
    if ((DIMENSION_KEYS as readonly string[]).includes(opt.dimension)) {
      fp[opt.dimension as DimensionKey] += opt.points;
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
