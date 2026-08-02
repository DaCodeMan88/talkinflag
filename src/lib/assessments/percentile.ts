// Percentile helpers for assessment results.
//
// Semantics: `percentileOf` uses the "percent at or below" (cumulative share)
// definition — the share of the sample whose value is <= `value`, as a percent
// (0–100, one decimal). We chose <= (inclusive) over "strictly-below + half of
// ties" for two reasons:
//   1. It reads honestly as "you scored at or above N% of takers" — an
//      inclusive claim never overstates where you land.
//   2. The caller builds the sample from ALL stored attempts for a category,
//      which INCLUDES the just-saved attempt. With <=, the taker's own score is
//      counted as a tie at or below itself, so a lone first taker lands at
//      100.0 rather than a misleading 0. The UI still suppresses the number
//      entirely until `hasEnoughSamples`, so no thin-data percentile is shown.

/**
 * Percent of `sample` at or below `value` (0–100, one decimal).
 * Returns null when the sample is empty (no basis for a percentile).
 */
export function percentileOf(value: number, sample: number[]): number | null {
  if (sample.length === 0) return null;
  let atOrBelow = 0;
  for (const s of sample) if (s <= value) atOrBelow += 1;
  const pct = (atOrBelow / sample.length) * 100;
  const clamped = Math.max(0, Math.min(100, pct));
  return Math.round(clamped * 10) / 10;
}

/**
 * Gate for showing a percentile at all. Below `min` distinct attempts the
 * number is statistically meaningless, so the UI must suppress it and show an
 * honest "one of the first N" line instead.
 */
export function hasEnoughSamples(n: number, min = 20): boolean {
  return n >= min;
}
