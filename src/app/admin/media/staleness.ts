/**
 * How stale the grid is allowed to get before the page says something.
 *
 * The job is monthly, so 35 days is "you've missed one", not "you're late" —
 * wide enough that a normal month never nags.
 */
export const STALE_AFTER_DAYS = 35;

/** Only the field the staleness reading depends on. */
type Curated = { updated_at?: string | null };

/**
 * Whole days since the most recent edit to any row — the staleness nag.
 *
 * Null when nothing readable was ever stamped: an unstamped grid has no
 * curation date, and rendering "0 days ago" for it would claim a check that
 * never happened. Unparsable stamps are skipped rather than poisoning the
 * maximum, and a future stamp (clock skew) clamps to 0.
 */
export function daysSinceLastCuration(rows: Curated[]): number | null {
  const stamps = rows
    .map((r) => (r.updated_at ? new Date(r.updated_at).getTime() : NaN))
    .filter((t) => Number.isFinite(t));
  if (stamps.length === 0) return null;
  return Math.max(0, Math.floor((Date.now() - Math.max(...stamps)) / 86_400_000));
}
