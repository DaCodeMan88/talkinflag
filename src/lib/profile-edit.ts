import { hasDisplayableValue } from "./profile-visibility";

/**
 * Stats JSONB keys a claimed player may edit through the dashboard.
 * Anything else sent by a client (team_designation, source, seed_batch,
 * roster_year, …) is stripped server-side before the merge.
 */
export const EDITABLE_STATS_KEYS = [
  "wingspan_in",
  "forty_yard",
  "vertical_jump",
  "years_active",
  "occupation",
  "education",
  "caps",
  "world_appearances",
  "jersey",
  "club",
  "nickname",
  "achievements",
  "tournaments",
] as const;

export type EditableStatsKey = (typeof EDITABLE_STATS_KEYS)[number];

/** Editing any of these resets is_verified — they are the load-bearing facts. */
export const VERIFICATION_SENSITIVE_KEYS = [
  "caps",
  "world_appearances",
  "tournaments",
  "achievements",
] as const;

const MAX_ACHIEVEMENTS = 20;
const MAX_ACHIEVEMENT_CHARS = 160;
const MAX_TOURNAMENTS = 30;
const MAX_TOURNAMENT_STR = 120;

function intInRange(v: unknown, min: number, max: number): number | null {
  const n = parseInt(String(v), 10);
  return isNaN(n) || n < min || n > max ? null : n;
}

function cappedString(v: unknown, max: number): string | null {
  const s = String(v ?? "").trim().slice(0, max);
  return s || null;
}

function sanitizeAchievements(v: unknown): string[] | null {
  if (!Array.isArray(v)) return null;
  const out = v
    .filter((a): a is string => typeof a === "string")
    .map((a) => a.trim().slice(0, MAX_ACHIEVEMENT_CHARS))
    .filter((a) => a !== "")
    .slice(0, MAX_ACHIEVEMENTS);
  return out.length > 0 ? out : null;
}

export interface TournamentRow {
  year?: number;
  event?: string;
  result?: string;
  location?: string;
}

function sanitizeTournaments(v: unknown): TournamentRow[] | null {
  if (!Array.isArray(v)) return null;
  const out: TournamentRow[] = [];
  for (const raw of v) {
    if (out.length >= MAX_TOURNAMENTS) break;
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) continue;
    const r = raw as Record<string, unknown>;
    const row: TournamentRow = {};
    if (r.year !== undefined && r.year !== null && r.year !== "") {
      const y = intInRange(r.year, 1990, 2035);
      if (y !== null) row.year = y;
    }
    for (const key of ["event", "result", "location"] as const) {
      if (r[key] !== undefined) {
        const s = cappedString(r[key], MAX_TOURNAMENT_STR);
        if (s !== null) row[key] = s;
      }
    }
    // Drop rows with no displayable content at all
    if (row.year !== undefined || row.event || row.result || row.location) out.push(row);
  }
  return out.length > 0 ? out : null;
}

/**
 * Sanitize an incoming profile-edit body into stats JSONB fields.
 *
 * - Only allowlisted keys are considered; everything else is stripped.
 * - Only keys present in the body appear in the result (PATCH semantics).
 * - A value of `null` means "clear this key" (the route's displayable-value
 *   sweep removes it from the merged stats).
 */
export function sanitizeStatsPayload(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  const set = (key: EditableStatsKey, value: unknown) => {
    if (body[key] !== undefined) out[key] = value;
  };

  set("wingspan_in", intInRange(body.wingspan_in, 48, 108));
  set("vertical_jump", intInRange(body.vertical_jump, 10, 60));
  set("years_active", intInRange(body.years_active, 0, 30));
  set("caps", intInRange(body.caps, 0, 1000));
  set("world_appearances", intInRange(body.world_appearances, 0, 50));

  if (body.forty_yard !== undefined) {
    const f = parseFloat(String(body.forty_yard));
    out.forty_yard = isNaN(f) || f < 3.5 || f > 8 ? null : f.toFixed(2);
  }

  set("occupation", cappedString(body.occupation, 100));
  set("education", cappedString(body.education, 100));
  set("jersey", cappedString(body.jersey, 10));
  set("club", cappedString(body.club, 120));
  set("nickname", cappedString(body.nickname, 60));

  set("achievements", sanitizeAchievements(body.achievements));
  set("tournaments", sanitizeTournaments(body.tournaments));

  return out;
}

/** Graduation year: any plausible HS/college year, past or future. */
export function sanitizeGradYear(v: unknown): number | null {
  const n = parseInt(String(v), 10);
  return isNaN(n) || n < 1950 || n > 2040 ? null : n;
}

export const ALLOWED_POSITIONS =["QB", "WR", "DB", "LB", "C", "Rusher", "Utility"] as const;

/**
 * Soft identity fields a claimed player may self-edit (direct columns).
 * Guarded fields (first_name, last_name, school_or_team, level) are intentionally
 * NOT here — they go through profile_change_requests + admin approval.
 * PATCH semantics: only keys present in `body` appear in the result.
 */
export function sanitizeIdentityPayload(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (body.position !== undefined) {
    const p = String(body.position).trim();
    out.position = (ALLOWED_POSITIONS as readonly string[]).includes(p) ? p : null;
  }
  if (body.city !== undefined) out.city = cappedString(body.city, 80);
  if (body.country !== undefined) out.country = cappedString(body.country, 60);
  return out;
}

/** Coerce numeric-looking values ("25" vs 25) so legacy string data compares equal. */
function asNumberish(v: unknown): unknown {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return isNaN(n) ? v : n;
}

/** Canonical JSON form for change detection (stable key order, absent ≡ null/empty). */
function canonical(key: string, value: unknown): string {
  if (!hasDisplayableValue(value)) return "∅";
  if (key === "tournaments" && Array.isArray(value)) {
    const rows = value.map((raw) => {
      const r = (raw ?? {}) as Record<string, unknown>;
      return {
        year: asNumberish(r.year),
        event: r.event ?? null,
        result: r.result ?? null,
        location: r.location ?? null,
      };
    });
    return JSON.stringify(rows);
  }
  if (key === "caps" || key === "world_appearances") {
    return JSON.stringify(asNumberish(value));
  }
  return JSON.stringify(value);
}

/**
 * True when the sanitized payload changes any verification-sensitive value
 * (caps, world_appearances, tournaments, achievements) relative to the
 * existing stats — including blanking one out. Keys not present in the
 * payload are ignored.
 */
export function shouldResetVerification(
  existingStats: Record<string, unknown> | null | undefined,
  sanitizedFields: Record<string, unknown>
): boolean {
  const existing = existingStats ?? {};
  return VERIFICATION_SENSITIVE_KEYS.some((key) => {
    if (!(key in sanitizedFields)) return false;
    return canonical(key, existing[key]) !== canonical(key, sanitizedFields[key]);
  });
}
