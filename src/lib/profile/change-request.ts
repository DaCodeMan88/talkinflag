export const GUARDED_FIELDS = ["first_name", "last_name", "school_or_team", "level"] as const;
export type GuardedField = (typeof GUARDED_FIELDS)[number];

const ALLOWED_LEVELS = ["youth", "high_school", "college", "national", "pro"] as const;
const MAX = 120;

export interface SanitizedChange {
  field: GuardedField;
  value: string;
}

/** Validate a requested guarded-field change. Returns null if invalid. */
export function sanitizeChangeRequest(field: unknown, value: unknown): SanitizedChange | null {
  if (typeof field !== "string" || !(GUARDED_FIELDS as readonly string[]).includes(field)) return null;
  const f = field as GuardedField;
  const v = String(value ?? "").trim().slice(0, MAX);
  if (!v) return null;
  if (f === "level" && !(ALLOWED_LEVELS as readonly string[]).includes(v)) return null;
  return { field: f, value: v };
}

export function guardedFieldLabel(field: GuardedField): string {
  return {
    first_name: "First name",
    last_name: "Last name",
    school_or_team: "Team / School",
    level: "Competition level",
  }[field];
}
