import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Static guard against the recurring RLS-client bug class:
 * tables with RLS enabled and ZERO policies return no rows / affect no rows
 * when queried with the cookie-bound (anon+session) client — silently.
 * Those tables may only be accessed with a service-role client.
 *
 * SERVICE_ONLY must mirror the live DB (tables where rowsecurity=true and
 * pg_policies has no rows). Re-verify with:
 *   select t.tablename from pg_tables t
 *   left join pg_policies p on p.tablename = t.tablename and p.schemaname='public'
 *   where t.schemaname='public' and t.rowsecurity and p.policyname is null
 *   group by t.tablename;
 */
const SERVICE_ONLY = new Set([
  "career_updates", "claim_events", "contact_submissions", "eval_items",
  "event_results", "events", "featured_athlete", "form_drafts", "guests",
  "highlight_submissions", "iq_questions", "newsletter_subscribers",
  "players", "profile_reports", "recruiters",
]);

/** Tables with real policies that the cookie client may query. */
const COOKIE_OK = new Set([
  "coaches", "coach_player_notes", "coach_profile_views", "coach_roster_spots",
  "eval_dimensions", "eval_questionnaires", "eval_reference", "eval_responses",
  "follows", "iq_attempts", "iq_best", "iq_quizzes", "league_difficulty",
  "member_roles", "ranking_snapshots", "ranking_weights", "recruiting_interests",
  "scout_applications", "scouts", "stat_verifications",
]);

// Reference SERVICE_ONLY so the doc contract stays live: every service-only
// table must NOT be in COOKIE_OK. If both sets ever claim a table, the guard
// itself is misconfigured.
const overlap = [...SERVICE_ONLY].filter((t) => COOKIE_OK.has(t));

const SRC_DIR = join(__dirname, "..", "..");

/** Recursively list all .ts/.tsx source files under dir (skips node_modules, dotfiles, tests). */
function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith(".") || entry === "node_modules") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (/\.tsx?$/.test(entry) && !entry.includes(".test.")) {
      out.push(full);
    }
  }
  return out;
}

type Violation = { file: string; line: number; call: string };

/**
 * Find every `<cookieClientVar>.from("<table>")` where <table> is not in
 * COOKIE_OK. Handles:
 *   - alias imports: `import { createClient as createServerClient } from "@/lib/supabase/server"`
 *   - same-line calls: `await supabase.from("players").update(...)`
 *   - chained/multi-line: `await supabase\n  .from("players")\n  .select(...)`
 *   - mid-expression usage: `Promise.all([supabase.from("x")..., ...])`
 */
function findViolations(file: string): Violation[] {
  const content = readFileSync(file, "utf8");

  // 1. Which local name(s) does the cookie factory have in this file?
  const importRe =
    /import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*["']@\/lib\/supabase\/server["']/g;
  const factoryNames: string[] = [];
  for (const m of content.matchAll(importRe)) {
    const alias = /\bcreateClient\b(?:\s+as\s+([A-Za-z_$][\w$]*))?/.exec(m[1]);
    if (alias) factoryNames.push(alias[1] ?? "createClient");
  }
  if (factoryNames.length === 0) return [];

  // 2. Variables assigned from the factory: `const supabase = await createClient()`.
  const clientVars = new Set<string>();
  for (const name of factoryNames) {
    const assignRe = new RegExp(
      `(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*(?:await\\s+)?${name}\\s*\\(`,
      "g"
    );
    for (const m of content.matchAll(assignRe)) clientVars.add(m[1]);
  }
  if (clientVars.size === 0) return [];

  // 3. Every `<var> . from ( "table" )` — whitespace/newlines allowed between
  //    the variable and `.from(`, which covers chained and mid-expression forms.
  const violations: Violation[] = [];
  const seen = new Set<string>();
  for (const varName of clientVars) {
    const useRe = new RegExp(
      `(?<![\\w$.])${varName}\\s*\\.\\s*from\\s*\\(\\s*["'\`]([\\w]+)["'\`]`,
      "g"
    );
    for (const m of content.matchAll(useRe)) {
      const table = m[1];
      if (COOKIE_OK.has(table)) continue;
      // Report the line of the `.from(` token, not the variable reference.
      const fromOffset = (m.index ?? 0) + m[0].indexOf(".");
      const line = content.slice(0, fromOffset).split("\n").length;
      const key = `${line}:${varName}:${table}`;
      if (seen.has(key)) continue;
      seen.add(key);
      violations.push({ file, line, call: `${varName}.from("${table}")` });
    }
  }
  return violations;
}

describe("supabase cookie-client usage guard", () => {
  it("never queries service-only (zero-policy) tables with the cookie-bound client", () => {
    expect(overlap, "SERVICE_ONLY and COOKIE_OK must be disjoint").toEqual([]);

    const violations = walk(SRC_DIR)
      .flatMap(findViolations)
      .sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

    const report = violations
      .map((v) => `${v.file.replace(`${SRC_DIR}/`, "src/")}:${v.line}  ${v.call}`)
      .join("\n");

    expect(
      violations,
      `Cookie-bound Supabase client used on tables without RLS policies — these reads/writes silently affect ZERO rows.\n` +
        `Route these queries through createAdminClient() from "@/lib/eval/admin-client" (service role) after verifying auth.\n` +
        `The cookie client is only for auth.getUser() and COOKIE_OK tables.\n\n${report}\n`
    ).toEqual([]);
  });
});
