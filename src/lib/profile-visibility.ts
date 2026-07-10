/**
 * True when a profile stat/metric value is worth rendering.
 *
 * False for: null, undefined, empty/whitespace-only strings, placeholder
 * junk ("?", "N/A"), and empty arrays. True for everything else —
 * including 0, non-empty strings, and non-empty arrays.
 */
export function hasDisplayableValue(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") {
    const s = v.trim();
    if (s === "") return false;
    if (s === "?") return false;
    if (s.toLowerCase() === "n/a") return false;
    return true;
  }
  if (Array.isArray(v)) return v.length > 0;
  return true;
}
