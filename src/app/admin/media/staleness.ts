/**
 * How stale the grid is allowed to get before the page says something.
 *
 * The job is monthly, so 35 days is "you've missed one", not "you're late" —
 * wide enough that a normal month never nags.
 */
export const STALE_AFTER_DAYS = 35;

/**
 * Only the field the staleness reading depends on.
 *
 * Deliberately NOT `updated_at`: `movePost` stamps that on every live row, and
 * `updatePost` stamps it on a note-only edit, so reading it would let nudging
 * one reel up a slot reset "last curated" to zero without a single performance
 * number having been read. `metrics_captured_on` is set by `capturedOn` only
 * when a number was actually entered, which is what curation means here.
 */
type Curated = { metrics_captured_on?: string | null };

/**
 * Whole days since the most recent hand-read performance capture — the
 * staleness nag.
 *
 * Null when nothing readable was ever captured: an ungraded grid has no
 * curation date, and rendering "0 days ago" for it would claim a check that
 * never happened. Unparsable values are skipped rather than poisoning the
 * maximum, and a future date (clock skew) clamps to 0.
 *
 * The column is a Postgres DATE, so values arrive as a bare "YYYY-MM-DD".
 * `Date.parse` reads that date-only form as UTC midnight, which is the same
 * clock `capturedOn` writes from (`toISOString().slice(0, 10)`) — so the two
 * halves agree and the count can't drift a day on a non-UTC server.
 */
export function daysSinceLastCuration(rows: Curated[]): number | null {
  const stamps = rows
    .map((r) => (r.metrics_captured_on ? Date.parse(r.metrics_captured_on) : NaN))
    .filter((t) => Number.isFinite(t));
  if (stamps.length === 0) return null;
  return Math.max(0, Math.floor((Date.now() - Math.max(...stamps)) / 86_400_000));
}
