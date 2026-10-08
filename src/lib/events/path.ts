/**
 * Event URLs use the readable slug (migration 028). Rows read before the
 * migration, or from a select that omitted `slug`, fall back to the UUID —
 * the event page 301s a UUID to its slug, so the fallback still lands right.
 */
export const SITE_URL = "https://talkinflag.com";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function eventPath(event: { id: string; slug?: string | null }): string {
  return `/events/${event.slug || event.id}`;
}

export function eventUrl(event: { id: string; slug?: string | null }): string {
  return `${SITE_URL}${eventPath(event)}`;
}

/** An event is past once its last day is over (end_date when set, else start_date). */
export function isPastEvent(
  event: { start_date: string; end_date?: string | null },
  today: string
): boolean {
  return (event.end_date || event.start_date) < today;
}
