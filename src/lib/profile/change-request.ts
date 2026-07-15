export const GUARDED_FIELDS = ["first_name", "last_name", "school_or_team", "level", "roster_year"] as const;
export type GuardedField = (typeof GUARDED_FIELDS)[number];

/**
 * Guarded fields that live inside the `stats` JSONB blob rather than in a
 * top-level `players` column. The change-request read path and the admin
 * apply path both branch on this so a roster_year edit merges into `stats`
 * instead of trying to write a non-existent `roster_year` column.
 */
export const STATS_GUARDED_FIELDS: readonly GuardedField[] = ["roster_year"];
export function isStatsField(field: GuardedField): boolean {
  return STATS_GUARDED_FIELDS.includes(field);
}

const ALLOWED_LEVELS = ["youth", "high_school", "college", "national", "pro"] as const;
const MIN_ROSTER_YEAR = 2000;
const MAX_ROSTER_YEAR = 2035;
const MAX = 120;

export interface SanitizedChange {
  field: GuardedField;
  value: string;
}

/** Validate a requested guarded-field change. Returns null if invalid. */
export function sanitizeChangeRequest(field: unknown, value: unknown): SanitizedChange | null {
  if (typeof field !== "string" || !(GUARDED_FIELDS as readonly string[]).includes(field)) return null;
  const f = field as GuardedField;
  const v = String(value ?? "").replace(/[\r\n\t]+/g, " ").trim().slice(0, MAX);
  if (!v) return null;
  if (f === "level" && !(ALLOWED_LEVELS as readonly string[]).includes(v)) return null;
  if (f === "roster_year") {
    if (!/^\d{4}$/.test(v)) return null;
    const yr = Number(v);
    if (yr < MIN_ROSTER_YEAR || yr > MAX_ROSTER_YEAR) return null;
  }
  return { field: f, value: v };
}

export function guardedFieldLabel(field: GuardedField): string {
  return {
    first_name: "First name",
    last_name: "Last name",
    school_or_team: "Team / School",
    level: "Competition level",
    roster_year: "National roster year",
  }[field];
}
