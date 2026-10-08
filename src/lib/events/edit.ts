/**
 * Validation for the admin event editor (/admin/events/[id]/edit).
 * Pure, so it is tested without a database.
 *
 * The slug is deliberately not editable here: changing it would break every
 * link already shared and every URL Google holds. It is set once, on insert,
 * by the events_set_slug trigger (migration 028).
 */
export const EVENT_LEVELS = [
  "youth",
  "high_school",
  "college",
  "national",
  "pro",
  "international",
  "olympics",
] as const;

export interface EventEdit {
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  location: string | null;
  city: string | null;
  country: string | null;
  country_code: string | null;
  level: string | null;
  event_type: string | null;
  website_url: string | null;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function text(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

export type ParseResult = { ok: true; value: EventEdit } | { ok: false; error: string };

export function parseEventForm(fd: FormData): ParseResult {
  const title = text(fd, "title");
  if (!title) return { ok: false, error: "Title is required." };

  const start_date = text(fd, "start_date");
  if (!start_date || !DATE_RE.test(start_date)) return { ok: false, error: "Start date is required." };

  const end_date = text(fd, "end_date");
  if (end_date && !DATE_RE.test(end_date)) return { ok: false, error: "End date is not a valid date." };
  if (end_date && end_date < start_date) return { ok: false, error: "End date is before the start date." };

  const country_code_raw = text(fd, "country_code");
  const country_code = country_code_raw ? country_code_raw.toUpperCase() : null;
  if (country_code && !/^[A-Z]{2}$/.test(country_code)) {
    return { ok: false, error: "Country code must be two letters, e.g. IT or DE (it shows the flag)." };
  }

  const level = text(fd, "level");
  if (level && !(EVENT_LEVELS as readonly string[]).includes(level)) {
    return { ok: false, error: "Unknown level." };
  }

  const website_url = text(fd, "website_url");
  if (website_url && !/^https?:\/\/\S+$/i.test(website_url)) {
    return { ok: false, error: "Website must start with https://" };
  }

  return {
    ok: true,
    value: {
      title,
      description: text(fd, "description"),
      start_date,
      end_date,
      location: text(fd, "location"),
      city: text(fd, "city"),
      country: text(fd, "country"),
      country_code,
      level,
      event_type: text(fd, "event_type"),
      website_url,
    },
  };
}
