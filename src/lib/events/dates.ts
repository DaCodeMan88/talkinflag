/**
 * "Saturday, June 14, 2026" / "June 14 – 16, 2026" / "June 30, 2026 – July 2, 2026".
 *
 * The same-month case used to format the end date with
 * toLocaleDateString({ day, year }). That option pair has no standard en-US
 * pattern, and ICU renders it as "2026 (day: 26)", so the live page read
 * "September 24 – 2026 (day: 26)". The day and year are now joined by hand.
 */
export function formatDateRange(start: string, end?: string | null): string {
  const fmt = (d: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { ...opts, timeZone: "UTC" });

  if (!end || end === start) {
    return fmt(start, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }
  const s = new Date(start + "T12:00:00Z");
  const e = new Date(end + "T12:00:00Z");
  if (s.getUTCFullYear() === e.getUTCFullYear() && s.getUTCMonth() === e.getUTCMonth()) {
    return `${fmt(start, { month: "long", day: "numeric" })} – ${e.getUTCDate()}, ${e.getUTCFullYear()}`;
  }
  return `${fmt(start, { month: "long", day: "numeric", year: "numeric" })} – ${fmt(end, { month: "long", day: "numeric", year: "numeric" })}`;
}
