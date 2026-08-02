/**
 * Pure helpers for the budget item type. No DOM, fully unit-tested.
 * An allocation maps an option index (as a string key) to a point value.
 */

/** Sum of the non-negative, finite values in the allocation. */
function usedTotal(alloc: Record<string, number>): number {
  let sum = 0;
  for (const v of Object.values(alloc)) {
    if (typeof v === "number" && Number.isFinite(v) && v > 0) sum += v;
  }
  return sum;
}

/** Points left to allocate (may be negative if over-allocated). */
export function remaining(alloc: Record<string, number>, total = 100): number {
  return total - usedTotal(alloc);
}

/**
 * Evenly split `total` across `n` buckets keyed "0".."n-1", distributing any
 * remainder to the earliest keys so the values sum to exactly `total`.
 */
export function splitEvenly(n: number, total = 100): Record<string, number> {
  const out: Record<string, number> = {};
  if (!Number.isFinite(n) || n <= 0) return out;
  const base = Math.floor(total / n);
  let remainder = total - base * n;
  for (let i = 0; i < n; i++) {
    out[String(i)] = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
  }
  return out;
}

/**
 * Return a new allocation with `index` set to `value`, clamped to
 * [0, total - (points used by the OTHER indices)] so the running total can
 * never exceed `total`. `n` is the number of options (unused directly but kept
 * for a stable signature / future validation).
 */
export function clampAllocation(
  alloc: Record<string, number>,
  index: number,
  value: number,
  n: number,
  total = 100
): Record<string, number> {
  const key = String(index);
  const usedByOthers = usedTotal(alloc) - (alloc[key] > 0 ? alloc[key] : 0);
  const headroom = Math.max(0, total - usedByOthers);
  const safe = Number.isFinite(value) ? value : 0;
  const clamped = Math.min(headroom, Math.max(0, safe));
  return { ...alloc, [key]: clamped };
}
