/**
 * Flagger (and intern) application validator. Pure, so it is tested in node.
 *
 * Mirrors the Team intake design (Dub plan 2026-10-18, Task 8): applications are
 * HELD, never auto-accepted, when the applicant is under 18 (guardian consent
 * first), a current college athlete (NIL check first) or an international intern
 * (the school confirms CPT first). Status is computed here, not chosen by the form.
 */

export const FLAGGER_FIELDS = [
  "track", "name", "email", "school", "year", "location", "availability", "equipment",
  "experience", "age_band", "athlete", "international", "role_interest", "links",
] as const;

export type FlaggerField = (typeof FLAGGER_FIELDS)[number];
export type FlaggerStatus = "new" | "needs_guardian_consent" | "needs_nil_check" | "needs_cpt";
export type FlaggerRow = Record<FlaggerField, string> & { status: FlaggerStatus; received_at: string };

export type ValidationResult =
  | { ok: true; drop: false; row: FlaggerRow }
  | { ok: false; drop: true; reason: string }
  | { ok: false; drop: false; reason: "invalid"; errors: string[] };

const MIN_FILL_MS = 3000;
const MAX_FILL_MS = 2 * 60 * 60 * 1000;

function stripControls(s: string): string {
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c >= 32 && c !== 127) out += s[i];
  }
  return out;
}

function clean(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (typeof v !== "string") return "";
  return stripControls(v).trim().slice(0, 500);
}

function statusFor(row: Record<FlaggerField, string>): FlaggerStatus {
  if (row.age_band === "under18") return "needs_guardian_consent";
  if (row.athlete === "yes") return "needs_nil_check";
  if (row.track === "intern" && row.international === "yes") return "needs_cpt";
  return "new";
}

export function validateFlaggerApplication(body: unknown, nowMs: number): ValidationResult {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  if (clean(b.website) !== "") return { ok: false, drop: true, reason: "honeypot" };
  const rendered = Number(b.rendered_at);
  if (!Number.isFinite(rendered) || rendered <= 0) return { ok: false, drop: true, reason: "no_render_stamp" };
  const elapsed = nowMs - rendered;
  if (elapsed < MIN_FILL_MS || elapsed > MAX_FILL_MS) return { ok: false, drop: true, reason: "timing" };

  const row = {} as Record<FlaggerField, string>;
  for (const f of FLAGGER_FIELDS) row[f] = clean(b[f]);
  row.email = row.email.toLowerCase();

  const errors: string[] = [];
  if (row.track !== "flagger" && row.track !== "intern") errors.push("track");
  if (row.name === "") errors.push("name");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(row.email)) errors.push("email");
  if (row.age_band !== "under18" && row.age_band !== "18plus") errors.push("age_band");
  if (row.athlete !== "yes" && row.athlete !== "no") errors.push("athlete");
  if (row.international !== "yes" && row.international !== "no") errors.push("international");
  if (row.track === "intern" && row.school === "") errors.push("school");
  if (row.location === "") errors.push("location");
  if (errors.length) return { ok: false, drop: false, reason: "invalid", errors };

  return {
    ok: true,
    drop: false,
    row: { ...row, status: statusFor(row), received_at: new Date(nowMs).toISOString() },
  };
}

/** One "key: value" line per field, for the contact_submissions message and the admin email. */
export function formatApplication(row: FlaggerRow): string {
  const lines = [`status: ${row.status}`, `received_at: ${row.received_at}`];
  for (const f of FLAGGER_FIELDS) lines.push(`${f}: ${row[f]}`);
  return lines.join("\n");
}
