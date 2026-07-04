import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Static guard for admin authorization.
 *
 * RLS runs with mostly zero policies here — all real data access happens
 * server-side, so middleware does NOT protect /admin or /api/admin. Every
 * admin surface must therefore gate ITSELF with the canonical helpers from
 * src/lib/admin.ts (getAdminUser / isAdminEmail). Cron-capable routes may
 * alternatively gate on CRON_SECRET (Bearer token).
 *
 * "Is signed in" is NOT a gate — any user with an account would pass. Nor is
 * a local, case-sensitive copy of the ADMIN_EMAILS list: those drift from
 * the canonical env parsing (legacy ADMIN_EMAIL fallback, trim, lowercase)
 * and are exactly the bug class this guard exists to kill.
 *
 * Limitations: this is a text-level check. A file that imports getAdminUser
 * but never calls it would pass; the sweep (and code review) covers that.
 */

// __dirname is src/lib → "../app" is src/app. The sanity test below fails
// loudly if this ever stops resolving to the real app tree.
const APP = join(__dirname, "..", "app");

/** Recursively list all files under dir (skips node_modules, dotfiles, tests). */
function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith(".") || entry === "node_modules") continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (!entry.includes(".test.")) out.push(p);
  }
  return out;
}

const rel = (f: string) => f.replace(APP, "src/app");

// Admin surfaces = server entry points that must self-authorize:
//   /admin pages + server actions (any .ts file containing a "use server"
//   directive, not just files named actions.ts), and every /api/admin route
//   handler. Client components ("use client" buttons/forms) are excluded —
//   they can only reach data through one of these surfaces.
const adminFiles = walk(join(APP, "admin"));
const adminSurfaces = [
  ...new Set([
    ...adminFiles.filter((f) => /(?:^|\/)(page\.tsx|actions\.ts)$/.test(f)),
    ...adminFiles.filter(
      (f) => /\.ts$/.test(f) && readFileSync(f, "utf8").includes('"use server"')
    ),
    ...walk(join(APP, "api", "admin")).filter((f) =>
      /(?:^|\/)route\.ts$/.test(f)
    ),
  ]),
].sort();

// A local admin-email list is any of:
//   - a local binding named ADMIN_EMAILS / adminEmails (const ADMIN_EMAILS = ...)
//   - any direct process.env.ADMIN_EMAILS / ADMIN_EMAIL read inside src/app
// The ONLY place allowed to read those env vars is src/lib/admin.ts (outside
// the walked tree, so naturally excluded). Importing { ADMIN_EMAILS } from
// "@/lib/admin", or mentioning the name in a comment, does not match.
const LOCAL_LIST_RE =
  /\b(?:const|let|var)\s+(?:ADMIN_EMAILS|adminEmails)\s*(?::[^=\n]*)?=|process\.env\.ADMIN_EMAILS?\b/;

describe("admin authorization", () => {
  it("finds admin surfaces (sanity: path resolution works)", () => {
    // 16 pages + 6 actions + 5 api routes = 27 at the time of writing (all
    // current "use server" files are named actions.ts, so the directive scan
    // adds none — yet). If this drops to ≤10, APP is resolving to the wrong
    // directory and every other assertion here would vacuously pass.
    expect(adminSurfaces.length).toBeGreaterThan(10);
  });

  it.each(adminSurfaces.map((f) => [rel(f), f]))(
    "%s gates via lib/admin helpers (or CRON_SECRET for api routes)",
    (label, file) => {
      const src = readFileSync(file, "utf8");
      // CRON_SECRET is an escape hatch for cron-invoked API routes only —
      // pages and server actions are user-facing and must check admin-ness.
      const isApiRoute = label.startsWith("src/app/api/");
      const gated =
        /\b(?:getAdminUser|isAdminEmail)\b/.test(src) ||
        (isApiRoute && /\bCRON_SECRET\b/.test(src));
      expect(
        gated,
        `${label} has no canonical admin gate.\n` +
          `Middleware does not cover /admin or /api/admin — this file must authorize itself.\n` +
          `Use getAdminUser() or isAdminEmail() from "@/lib/admin" (cron API routes may check CRON_SECRET).\n` +
          `A bare auth.getUser() "signed in" check or a local ADMIN_EMAILS copy does not count.`
      ).toBe(true);
    }
  );

  it("has no local ADMIN_EMAILS lists / env reads outside src/lib/admin.ts", () => {
    const offenders = walk(APP)
      .filter((f) => /\.tsx?$/.test(f))
      .map((f) => {
        const lines = readFileSync(f, "utf8").split("\n");
        const line = lines.findIndex((l) => LOCAL_LIST_RE.test(l)) + 1;
        return { file: f, line };
      })
      .filter((o) => o.line > 0)
      .sort((a, b) => a.file.localeCompare(b.file));

    const report = offenders.map((o) => `${rel(o.file)}:${o.line}`).join("\n");

    // Scalar assertion so a failure prints only the curated message + count,
    // not an object dump with absolute paths (same convention as the
    // usage-guard test).
    expect(
      offenders.length,
      `Local ADMIN_EMAILS lists / direct env reads found in src/app.\n` +
        `These drift from the canonical list (no ADMIN_EMAIL legacy fallback, no trim/lowercase → case-sensitive compares).\n` +
        `Delete the local list and use isAdminEmail()/getAdminUser() (or import ADMIN_EMAILS) from "@/lib/admin".\n\n${report}\n`
    ).toBe(0);
  });
});
