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

/** Build the maxPerDimension map from the full item set (max option points × items in that dim). */
export function maxPerDimensionFrom(items: (ScoringItem & { section_key?: string })[]): Record<string, number> {
  const max: Record<string, number> = {};
  for (const item of items) {
    // an importance item awards its max points to its section dimension
    const best = Math.max(...item.options.map((o) => o.points));
    const bestOpt = item.options.find((o) => o.points === best);
    const dim = bestOpt?.dimension;
    if (dim) max[dim] = (max[dim] ?? 0) + best;
  }
  return max;
}
