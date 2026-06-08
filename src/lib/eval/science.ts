import { DIMENSION_KEYS, DimensionKey, Fingerprint, ScienceKey, SCIENCE_KEYS } from "./dimensions";

/**
 * Roll a 10-dimension fingerprint up to the 6 science dimensions (S1–S6) using a
 * map of dimension -> science key. Each science score is the mean of the
 * practical dimensions that map to it (0–10).
 */
export function scienceRollup(
  fingerprint: Fingerprint,
  sciMap: Partial<Record<DimensionKey, ScienceKey>>
): Record<ScienceKey, number> {
  const buckets: Record<string, number[]> = {};
  for (const k of DIMENSION_KEYS) {
    const s = sciMap[k];
    if (!s) continue;
    (buckets[s] ??= []).push(fingerprint[k]);
  }
  const out = Object.fromEntries(SCIENCE_KEYS.map((s) => [s, 0])) as Record<ScienceKey, number>;
  for (const s of SCIENCE_KEYS) {
    const arr = buckets[s];
    out[s] = arr && arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 1000) / 1000 : 0;
  }
  return out;
}

export type GapEntry = { key: string; delta: number };

/**
 * Compare a member's vector to the taxonomy-derived elite-ideal reference.
 * Returns per-key signed deltas (member − ideal) and the single largest
 * over-weighted and under-weighted keys, for the summary line.
 */
export function idealGap(
  member: Record<string, number>,
  reference: Record<string, number>
): { deltas: GapEntry[]; mostOver: GapEntry | null; mostUnder: GapEntry | null } {
  const deltas: GapEntry[] = Object.keys(reference).map((key) => ({
    key,
    delta: Math.round(((member[key] ?? 0) - reference[key]) * 1000) / 1000,
  }));
  let mostOver: GapEntry | null = null;
  let mostUnder: GapEntry | null = null;
  for (const d of deltas) {
    if (!mostOver || d.delta > mostOver.delta) mostOver = d;
    if (!mostUnder || d.delta < mostUnder.delta) mostUnder = d;
  }
  return { deltas, mostOver, mostUnder };
}
