# RLS Client Sweep + Launch Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate the entire "cookie-client vs service-role client" bug class (including the two reported bugs: recruiting toggle and verification approval), close the admin-authorization gaps it was masking, and add regression guards so the bug class cannot reappear — before the stress-test launch.

**Architecture:** This codebase intentionally runs Supabase with RLS enabled and (mostly) zero policies: the anon key can't touch app tables, and ALL data access flows through the Next.js server using the service-role key, with each route/page/action doing its own authorization (see `docs/plans/2026-06-23-security-hardening.md`, "Context: the security model"). Newer features (follows, IQ, eval, coaches) added real RLS policies and legitimately use the cookie-bound client. The bug: many call sites use the cookie-bound client against zero-policy tables — reads silently return no rows, writes silently affect zero rows. The fix is mechanical: swap those specific queries to the service-role client, keep the cookie client strictly for `auth.getUser()` and policy-backed tables, and enforce this with two static-analysis vitest tests (written FIRST — they are the failing tests that drive the whole sweep). **Critical pairing:** several admin pages/actions currently have missing or wrong authorization checks that the RLS bug accidentally masks; every client fix in an admin surface MUST land together with a proper admin gate, never before.

**Tech Stack:** Next.js 15 App Router · TypeScript · Supabase (`@supabase/ssr` + `@supabase/supabase-js`) · Vitest · deployed on Vercel (push to `main` auto-deploys)

---

## Background every executor must read first

### The three Supabase clients (and the naming trap)

| Helper | File | Key | Use for |
|---|---|---|---|
| `createClient()` | `src/lib/supabase/server.ts` | anon + user cookies | **auth only** (`auth.getUser()`), plus queries on policy-backed tables listed below |
| `createServerClient()` | `src/lib/supabase.ts` | **service role** | server-side data access (bypasses RLS) |
| `createAdminClient()` | `src/lib/eval/admin-client.ts` | **service role** | same as above; preferred in newer code (`persistSession: false`) |

**The trap that keeps causing this bug:** several files do
`import { createClient as createServerClient } from "@/lib/supabase/server"` — aliasing the *cookie* client with the *service-role* helper's name. When you edit any file, check the import line, never trust the variable name.

**Rule for all fixes in this plan:** use `createAdminClient()` from `@/lib/eval/admin-client` for the service-role swaps (it's the most-used modern helper). Do not create new helpers, do not use raw `createClient(url, SERVICE_ROLE_KEY)` inline.

### Table classification (verified against the live DB 2026-07-03)

**SERVICE-ONLY tables** — RLS enabled, **zero policies**. Cookie/anon client silently gets nothing. Every read/write MUST use a service-role client:

```
career_updates, claim_events, contact_submissions, eval_items, event_results,
events, featured_athlete, form_drafts, guests, highlight_submissions,
iq_questions, newsletter_subscribers, players, profile_reports, recruiters
```

**COOKIE-OK tables** — real RLS policies exist; cookie client is fine *for the access pattern the policy allows*:

```
coaches (public read; owner insert/update), coach_player_notes, coach_profile_views,
coach_roster_spots, eval_dimensions, eval_questionnaires, eval_reference,
eval_responses (own), follows (own), iq_attempts (own), iq_quizzes,
league_difficulty, member_roles (own), ranking_snapshots (read), ranking_weights (read),
recruiting_interests (coach-side), scout_applications (own), scouts (read own),
stat_verifications (read approved only; insert own-player), iq_best (view, definer — readable)
```

**Policy gotchas discovered in the audit (why some COOKIE-OK tables still break):**
- `stat_verifications_public_read` has qual `status = 'approved'` → **pending rows are invisible** to the cookie client. The admin verification queue must use service role.
- `stat_verifications` has **no UPDATE policy** → the approve/reject status write via cookie client silently updates zero rows (part of reported Bug #2).
- `stat_verifications_player_insert`'s `WITH CHECK` sub-selects `players`, which itself has zero policies → the subquery returns nothing under the anon/authenticated role, so **this insert policy can never pass**. Any cookie-client insert into `stat_verifications` is dead (affects `/api/scouts/submit`).
- `scout_applications` only has "read own" / "insert own" → an **admin** reading all applications, or updating one, via cookie client gets nothing.
- `coaches_owner_update` qual is `auth.uid() = user_id` → an **admin** updating another coach's row via cookie client silently updates zero rows (`/api/admin/coaches`).

### Admin authorization state (verified 2026-07-03)

- Middleware only matches `/dashboard/:path*` — **`/admin` and `/api/admin` are NOT protected by middleware.** Each page/action/route must gate itself.
- Canonical helper exists: `getAdminUser()` / `isAdminEmail()` in `src/lib/admin.ts` (case-insensitive, env-driven with fallback).
- **Gated correctly today:** `admin/page.tsx`, `admin/messages/*`, `admin/players/*` (pages + actions), `admin/claims/page.tsx`, `admin/reports/*`, `api/admin/career-updates/[id]`.
- **VULNERABLE — only checks "is signed in", not "is admin":** `admin/featured/actions.ts`, `admin/highlights/actions.ts`, `admin/events/[id]/results/actions.ts`. Any member with an account can invoke these server actions (currently masked by the RLS bug — the write silently fails).
- **Local duplicated `ADMIN_EMAILS` consts (case-sensitive compare, drift risk):** `api/admin/verifications/[id]/route.ts`, `api/admin/coaches/route.ts` (also: empty-string fallback means it fails-closed differently than `lib/admin.ts`), `api/admin/recompute-rankings/route.ts`, `admin/verifications/page.tsx`, and possibly other `admin/*/page.tsx` files with a `0` gating count in Task 5's test. Replace all with `lib/admin.ts` imports.

### Complete inventory of broken call sites (the sweep target)

Confirmed by cross-referencing every file importing `@/lib/supabase/server` against the tables it queries. Files listed here use the cookie client on SERVICE-ONLY tables (or hit the policy gotchas above). Files NOT listed were verified clean (they already route those tables through `createServerClient()`/`createAdminClient()` — e.g. `dashboard/page.tsx`, `players/[id]/page.tsx`, `api/drafts`, `api/iq/submit`, `api/eval/submit`, `api/admin/career-updates/[id]`, `api/players/[id]/{claim,photo,profile,verify}`, `api/players/submit`, `join/page.tsx`, `dashboard/following/page.tsx`).

**Group P — public-facing pages (visitors see empty sections):**
| File | Broken tables |
|---|---|
| `src/components/home/FeaturedAthleteSection.tsx` | featured_athlete |
| `src/components/home/Top10PlaysTeaser.tsx` | highlight_submissions |
| `src/components/home/LatestResultsTeaser.tsx` | events |
| `src/app/plays/page.tsx` | highlight_submissions |
| `src/app/plays/week/[week]/page.tsx` | highlight_submissions |
| `src/app/results/page.tsx` | events |
| `src/app/athletes/featured/page.tsx` | featured_athlete |

**Group M — member funnels:**
| File | Broken tables / notes |
|---|---|
| `src/app/api/players/[id]/recruiting/route.ts` | **Reported Bug #1.** players (read for authz + update) |
| `src/app/auth/claim/[id]/page.tsx` | players (claim landing page can't load the profile) |
| `src/app/dashboard/edit/page.tsx` | players |
| `src/app/dashboard/verify/page.tsx` | players (coaches/stat_verifications parts are fine) |
| `src/app/api/highlights/submit/route.ts` | highlight_submissions (dup-check read + insert) |
| `src/app/recruit/page.tsx` | players — ONLY the viewer's own-claim lookup (`supabase.from("players")...eq("claimed_by", user.id)` around line 30); the main list already uses `publicSupabase` |
| `src/app/api/players/[id]/interest/route.ts` | players (validation read); recruiting_interests/coaches parts are fine |
| `src/app/api/scouts/submit/route.ts` | stat_verifications insert (dead policy — see gotchas); the `scouts` read-own is fine |

**Group A — admin surfaces (fix client + gate TOGETHER):**
| File | Broken tables / notes |
|---|---|
| `src/app/api/admin/verifications/[id]/route.ts` | **Reported Bug #2.** stat_verifications update + approved-count read + players `is_verified` update; also local case-sensitive ADMIN_EMAILS |
| `src/app/admin/page.tsx` | cookie-client counts: stat_verifications (pending invisible), scout_applications, highlight_submissions, events, contact_submissions → move to the existing `adminDb` |
| `src/app/admin/verifications/page.tsx` | pending stat_verifications invisible (policy qual `status='approved'`) |
| `src/app/admin/messages/page.tsx` + `actions.ts` | contact_submissions (gating already correct) |
| `src/app/admin/players/[id]/edit/page.tsx` | players (gating already correct) |
| `src/app/admin/rankings/page.tsx` | players |
| `src/app/admin/featured/page.tsx` + `actions.ts` | featured_athlete, players; **actions missing admin check** |
| `src/app/admin/highlights/page.tsx` + `actions.ts` | highlight_submissions; **actions missing admin check** |
| `src/app/admin/events/page.tsx` | events |
| `src/app/admin/events/[id]/results/page.tsx` + `actions.ts` | events, event_results; **actions missing admin check** |
| `src/app/admin/scouts/page.tsx` | scout_applications (read-own policy hides everyone else's) |
| `src/app/api/scouts/approve/route.ts` | scout_applications read + update via cookie client (aliased as `createServerClient` — the trap); scouts upsert already service-role |
| `src/app/api/admin/coaches/route.ts` | coaches UPDATE as admin (owner-only policy blocks it); local ADMIN_EMAILS dup |
| `src/app/api/admin/recompute-rankings/route.ts` | verify the recompute library receives a service-role client (grep `src/lib/rankings/` and `src/lib/eval/recompute*`); local ADMIN_EMAILS dup |

### Out of scope / already handled (do NOT redo)

- XSS/JSON-LD, open redirect, PostgREST filter injection — fixed in `a878780`.
- Rate limiting + honeypot on the 4 public writers (`/api/contact`, `/api/newsletter`, `/api/players/submit`, `/api/events/submit`) — done (`ecec0b9`, `69023e1`). In-memory limiter auto-upgrades to Upstash when `UPSTASH_REDIS_REST_URL`/`_TOKEN` are set — recommend setting these before the stress test (owner action, final report).
- `vector` extension in `public` schema — WARN accepted by owner decision 2026-06-23; leave it.
- Leaked-password protection — Supabase dashboard toggle, not reachable via SQL/MCP; owner action (final report).
- The 15 `rls_enabled_no_policy` INFO advisors are **expected** under this architecture; do not add policies to "fix" them.
- No database migrations are needed anywhere in this plan. Code-only.

---

## Task 0: Preflight — worktree, baseline build & tests

**Files:** none modified.

**Step 1: Create a worktree branch** (repo: `/Users/danielharris/Desktop/Flag/talkinflag`, currently on `main`)

```bash
cd /Users/danielharris/Desktop/Flag/talkinflag
git worktree add ../talkinflag-rls-sweep -b rls-sweep
cd ../talkinflag-rls-sweep
npm install
```

**Step 2: Baseline verification**

```bash
npm test        # expect: all existing tests pass (~34+)
npm run build   # expect: clean build
```

If the baseline is red, STOP and report — do not fix pre-existing failures silently.

---

## Task 1: Write the failing guard test — cookie client must never touch service-only tables

This test drives the entire sweep: it statically scans the source, finds every variable bound to the cookie client, and fails on any `.from("<service-only table>")` call through it. It should FAIL now, listing exactly the files in the inventory above.

**Files:**
- Create: `src/lib/supabase/usage-guard.test.ts`

**Step 1: Write the test**

```ts
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

const SRC = join(__dirname, "..", "..");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(entry) && !/\.test\./.test(entry)) out.push(p);
  }
  return out;
}

type Violation = { file: string; line: number; text: string };

function findViolations(): Violation[] {
  const violations: Violation[] = [];
  for (const file of walk(SRC)) {
    const src = readFileSync(file, "utf8");
    // What local name is the cookie client factory imported under?
    const imp = src.match(
      /import\s*\{[^}]*createClient(?:\s+as\s+(\w+))?[^}]*\}\s*from\s*"@\/lib\/supabase\/server"/
    );
    if (!imp) continue;
    const factory = imp[1] ?? "createClient";
    // Find variables assigned from the cookie factory: const X = await factory()
    const varNames = new Set<string>();
    const assignRe = new RegExp(
      `(?:const|let)\\s+(\\w+)\\s*=\\s*await\\s+${factory}\\(\\)`, "g"
    );
    for (const m of src.matchAll(assignRe)) varNames.add(m[1]);
    if (varNames.size === 0) continue;
    // Flag <var>.from("<service-only or unknown table>")
    const lines = src.split("\n");
    for (const v of varNames) {
      const fromRe = new RegExp(`(?:^|[^\\w.])${v}\\s*(?:\\n\\s*)?\\.from\\("([a-z_]+)"\\)`, "g");
      for (const m of src.matchAll(fromRe)) {
        const table = m[1];
        if (COOKIE_OK.has(table)) continue;
        const line = src.slice(0, m.index!).split("\n").length;
        violations.push({ file: file.replace(SRC, "src"), line, text: `${v}.from("${table}")` });
      }
    }
    // Also catch the multi-line chained form: await v\n .from("t")
    for (const v of varNames) {
      for (let i = 0; i < lines.length - 1; i++) {
        const joined = lines[i] + lines[i + 1];
        const re = new RegExp(`(?:^|[^\\w.])${v}\\s*$`);
        const next = lines[i + 1].match(/^\s*\.from\("([a-z_]+)"\)/);
        if (re.test(lines[i].trimEnd()) && next && !COOKIE_OK.has(next[1])) {
          violations.push({ file: file.replace(SRC, "src"), line: i + 2, text: `${v}.from("${next[1]}")` });
        }
      }
    }
  }
  // De-duplicate (the two passes can overlap)
  const seen = new Set<string>();
  return violations.filter((x) => {
    const k = `${x.file}:${x.line}:${x.text}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

describe("cookie-bound Supabase client usage", () => {
  it("never queries service-only (zero-policy RLS) tables", () => {
    const violations = findViolations();
    const msg = violations.map((x) => `  ${x.file}:${x.line}  ${x.text}`).join("\n");
    expect(violations, `Cookie client used on service-only tables:\n${msg}\n\nFix: route these queries through createAdminClient() from "@/lib/eval/admin-client" (service role), keeping the cookie client only for auth.getUser() and COOKIE_OK tables.`).toEqual([]);
  });
});
```

**Step 2: Run it — verify it FAILS and the failure list matches the inventory**

```bash
npx vitest run src/lib/supabase/usage-guard.test.ts
```

Expected: FAIL, listing (at least) the Group P/M/A files from the inventory. If a file from the inventory is missing from the output, improve the regex until it's caught (e.g. chained `await supabase\n .from(...)` forms). If files NOT in the inventory show up, read them and classify: fix (likely) or add table to COOKIE_OK with a comment (only if a real policy covers that exact access).

**Step 3: Commit the (currently red) test**

```bash
git add src/lib/supabase/usage-guard.test.ts
git commit -m "test: add static guard against cookie-client access to service-only tables (currently red)"
```

Note for CI/local runs until Task 8 completes: run other tests with `npx vitest run --exclude '**/usage-guard.test.ts'` if you need a green run mid-sweep; the guard goes green as the sweep finishes.

---

## Task 2: Write the failing admin-gating guard test

**Files:**
- Create: `src/lib/admin-gating.test.ts`

**Step 1: Write the test**

```ts
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Every admin surface must authorize with the canonical helpers from
 * src/lib/admin.ts (getAdminUser / isAdminEmail). Middleware does NOT
 * protect /admin or /api/admin — each file gates itself.
 * Cron-capable routes may alternatively gate on CRON_SECRET.
 */
const APP = join(__dirname, "..", "app");

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const adminSurfaces = [
  ...walk(join(APP, "admin")).filter((f) => /(?:^|\/)(page\.tsx|actions\.ts)$/.test(f)),
  ...walk(join(APP, "api", "admin")).filter((f) => /route\.ts$/.test(f)),
];

describe("admin authorization", () => {
  it("finds admin surfaces (sanity)", () => {
    expect(adminSurfaces.length).toBeGreaterThan(10);
  });

  it.each(adminSurfaces.map((f) => [f.replace(APP, "src/app"), f]))(
    "%s gates via lib/admin helpers (or CRON_SECRET)",
    (_label, file) => {
      const src = readFileSync(file as string, "utf8");
      const gated = /getAdminUser|isAdminEmail/.test(src) || /CRON_SECRET/.test(src);
      expect(gated, `${_label} has no admin authorization check`).toBe(true);
    }
  );

  it("has no duplicated ADMIN_EMAILS lists outside src/lib/admin.ts", () => {
    const offenders = walk(APP).filter(
      (f) => /\.(ts|tsx)$/.test(f) && /ADMIN_EMAILS?\s*=|ADMIN_EMAILS\s*\?\?/.test(readFileSync(f, "utf8"))
    );
    expect(
      offenders.map((f) => f.replace(APP, "src/app")),
      "Use isAdminEmail()/getAdminUser() from @/lib/admin instead of local ADMIN_EMAILS lists (they drift and compare case-sensitively)"
    ).toEqual([]);
  });
});
```

**Step 2: Run it — verify it FAILS**

```bash
npx vitest run src/lib/admin-gating.test.ts
```

Expected failures: `admin/featured/actions.ts`, `admin/highlights/actions.ts`, `admin/events/[id]/results/actions.ts` (no gate); duplicated-ADMIN_EMAILS offenders: `api/admin/verifications/[id]/route.ts`, `api/admin/coaches/route.ts`, `api/admin/recompute-rankings/route.ts`, `admin/verifications/page.tsx`, plus any others it finds (the test IS the authoritative list). Some `admin/*/page.tsx` files may fail the gate check because they use a local ADMIN_EMAILS redirect — they'll be fixed by unifying on `getAdminUser()`.

**Step 3: Commit**

```bash
git add src/lib/admin-gating.test.ts
git commit -m "test: add static guard requiring canonical admin gating on all admin surfaces (currently red)"
```

---

## Task 3: Fix reported Bug #1 — recruiting toggle (`/api/players/[id]/recruiting`)

**Files:**
- Modify: `src/app/api/players/[id]/recruiting/route.ts`

**Step 1: Replace the file body** — cookie client stays for auth; ALL `players` access moves to service role. Complete new content:

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/eval/admin-client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data: player } = await db
    .from("players")
    .select("id, claimed_by, is_claimed")
    .eq("id", id)
    .single();

  if (!player || !player.is_claimed || player.claimed_by !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const recruiting_open = typeof body.recruiting_open === "boolean" ? body.recruiting_open : undefined;
  const recruiting_targets = Array.isArray(body.recruiting_targets) ? body.recruiting_targets : undefined;

  const update: Record<string, unknown> = {};
  if (recruiting_open !== undefined) update.recruiting_open = recruiting_open;
  if (recruiting_targets !== undefined) {
    const valid = ["college", "national", "both"];
    update.recruiting_targets = recruiting_targets.filter((t: unknown) => valid.includes(String(t)));
  }

  const { error } = await db.from("players").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
```

**Step 2: Verify the guard test no longer lists this file**

```bash
npx vitest run src/lib/supabase/usage-guard.test.ts 2>&1 | grep recruiting
```

Expected: no output (file cleared from the violation list).

**Step 3: Commit**

```bash
git add "src/app/api/players/[id]/recruiting/route.ts"
git commit -m "fix: recruiting toggle — players read/write must use service-role client (RLS zero-policy)"
```

---

## Task 4: Fix reported Bug #2 — verification approval (`/api/admin/verifications/[id]`)

**Files:**
- Modify: `src/app/api/admin/verifications/[id]/route.ts`

**Step 1: Rewrite** — three separate breaks in this file: (a) `stat_verifications` UPDATE has no policy → status never saved; (b) approved-count read is policy-limited; (c) `players.is_verified` update blocked. Also replace the local case-sensitive `ADMIN_EMAILS` with `isAdminEmail`, and reuse `createAdminClient` instead of the inline raw client. Keep the email-sending block as is (it already uses an admin client for `getUserById` — switch it to the shared `db`). Complete new content:

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/eval/admin-client";
import { isAdminEmail } from "@/lib/admin";
import { sendEmail } from "@/lib/email";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { status, playerId } = await req.json();
  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const db = createAdminClient();

  // Update verification status
  const { error: updateError } = await db
    .from("stat_verifications")
    .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: user.id })
    .eq("id", id);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // If approved, mark player as is_verified and notify them
  if (status === "approved" && playerId) {
    const { count } = await db
      .from("stat_verifications")
      .select("id", { count: "exact", head: true })
      .eq("player_id", playerId)
      .eq("status", "approved");

    if ((count ?? 0) >= 1) {
      await db.from("players").update({ is_verified: true }).eq("id", playerId);
    }

    // Email the player who claimed this profile
    const { data: player } = await db
      .from("players")
      .select("first_name, last_name, claimed_by")
      .eq("id", playerId)
      .single();

    if (player?.claimed_by) {
      const { data: userData } = await db.auth.admin.getUserById(player.claimed_by);
      const playerEmail = userData?.user?.email;
      if (playerEmail) {
        await sendEmail({
          to: playerEmail,
          subject: "Your stat was verified on Talkin Flag ✓",
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#000;color:#fff;padding:32px;">
              <p style="color:#FDDD58;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 24px;">Talkin Flag</p>
              <h1 style="font-size:28px;margin:0 0 12px;font-weight:900;text-transform:uppercase;">Stat Verified ✓</h1>
              <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.6;">
                Hi ${player.first_name}, a stat on your profile has been approved and your ✓ Verified badge is now live.
              </p>
              <div style="margin:32px 0;">
                <a href="https://talkinflag.com/dashboard" style="background:#FDDD58;color:#000;padding:12px 24px;font-weight:700;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;display:inline-block;">
                  View Your Profile →
                </a>
              </div>
              <p style="color:rgba(255,255,255,0.2);font-size:11px;margin-top:32px;">Talkin Flag · talkinflag.com</p>
            </div>
          `,
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
```

(Note the two `talkinflag.vercel.app` → `talkinflag.com` link fixes — the site launched on the real domain.)

**Step 2: Verify** — file gone from BOTH guard tests' failure lists:

```bash
npx vitest run src/lib/supabase/usage-guard.test.ts src/lib/admin-gating.test.ts 2>&1 | grep 'verifications/\[id\]'
```

Expected: no output.

**Step 3: Commit**

```bash
git add "src/app/api/admin/verifications/[id]/route.ts"
git commit -m "fix: verification approval — service-role writes + canonical case-insensitive admin check"
```

---

## Task 5: Sweep Group P — public pages

Mechanical transformation, same for each file: add `import { createAdminClient } from "@/lib/eval/admin-client";`, create `const db = createAdminClient();` next to the existing client, and move ONLY the service-only-table queries onto `db`. If the file has no auth usage at all after the change, drop the `@/lib/supabase/server` import entirely.

**Files (all Modify):**
1. `src/components/home/FeaturedAthleteSection.tsx` — `featured_athlete` query → `db`. No auth here → remove cookie-client import entirely.
2. `src/components/home/Top10PlaysTeaser.tsx` — `highlight_submissions` → `db`; remove cookie import.
3. `src/components/home/LatestResultsTeaser.tsx` — `events` → `db`; remove cookie import.
4. `src/app/plays/page.tsx` — `highlight_submissions` → `db`; remove cookie import if unused after.
5. `src/app/plays/week/[week]/page.tsx` — same.
6. `src/app/results/page.tsx` — `events` → `db`; same.
7. `src/app/athletes/featured/page.tsx` — `featured_athlete` → `db`; same.

**Step 1:** Apply the transformation to all 7 files. These render public data that was already public before RLS was enabled (approved Top-10 plays, events, featured athlete) — no authorization is needed; just make sure any existing `status`/`is_approved`-style filters in the queries are preserved exactly (service role bypasses RLS, so the WHERE clauses are now the only thing standing between drafts and the public — do not drop or loosen any filter).

**Step 2: Verify**

```bash
npx vitest run src/lib/supabase/usage-guard.test.ts 2>&1 | grep -E 'components/home|plays|results|athletes' 
npm run build
```

Expected: no grep output; clean build.

**Step 3: Commit**

```bash
git add src/components/home src/app/plays src/app/results src/app/athletes
git commit -m "fix: public pages — homepage teasers, plays, results, featured athlete read via service role"
```

---

## Task 6: Sweep Group M — member funnels

Same transformation; here the cookie client STAYS for `auth.getUser()` and any COOKIE-OK-table queries. Only the flagged queries move to `db = createAdminClient()`.

**Files (all Modify):**
1. `src/app/auth/claim/[id]/page.tsx` — `players` reads → `db`.
2. `src/app/dashboard/edit/page.tsx` — `players` read (own profile via `claimed_by = user.id`) → `db`. Keep the `eq("claimed_by", user.id)` scoping — it IS the authorization now.
3. `src/app/dashboard/verify/page.tsx` — `players` read → `db`. Leave `coaches` on the cookie client. If this page lists the member's own pending `stat_verifications`, move that read to `db` too (public-read policy hides pending rows).
4. `src/app/api/highlights/submit/route.ts` — both the duplicate-check read and the insert on `highlight_submissions` → `db`. Auth check (`getUser`) stays on the cookie client; keep all existing input validation.
5. `src/app/recruit/page.tsx` — ONLY the own-claim lookup `.from("players").select("id").eq("claimed_by", user.id)` moves to `db` (the page already has `publicSupabase = createServerClient()`; reuse that instead of adding a new client — either service client is fine, don't add both).
6. `src/app/api/players/[id]/interest/route.ts` — `players` validation read → `db`. Leave `coaches` + `recruiting_interests` on the cookie client (coach-side policies work and give defense-in-depth).
7. `src/app/api/scouts/submit/route.ts` — the `stat_verifications` insert → `db` (its insert policy can never pass — see gotchas). Keep the `scouts` read-own on the cookie client (it's the authz gate proving the caller is an approved scout — verify that check exists and runs BEFORE the insert; it does today at ~line 11).

**Step 2: Verify**

```bash
npx vitest run src/lib/supabase/usage-guard.test.ts 2>&1 | grep -E 'auth/claim|dashboard|highlights/submit|recruit|interest|scouts/submit'
npm run build
```

Expected: no grep output; clean build.

**Step 3: Commit**

```bash
git add src/app/auth src/app/dashboard src/app/recruit "src/app/api/highlights" "src/app/api/players/[id]/interest" src/app/api/scouts/submit
git commit -m "fix: member funnels — claim page, dashboard edit/verify, highlight submit, recruit self-lookup, scout stat submit via service role"
```

---

## Task 7: Sweep Group A — admin surfaces (client fix + gating land together)

**Ordering rule:** in each file, add/normalize the admin gate FIRST, then swap the client. A service-role query behind a missing gate is a live vulnerability; the reverse is merely still-broken.

**7a. Server actions missing admin checks (the vulnerability):**

Files: `src/app/admin/featured/actions.ts`, `src/app/admin/highlights/actions.ts`, `src/app/admin/events/[id]/results/actions.ts`

For every exported action in these files, replace the `if (!user) throw ...` pattern with the canonical gate, then move service-only-table queries to `db`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/eval/admin-client";

export async function setFeaturedAthlete(formData: FormData) {
  if (!(await getAdminUser())) throw new Error("Not authorized");
  const db = createAdminClient();
  // ... unchanged body, queries via db ...
}
```

(Exact shape shown for `setFeaturedAthlete`; apply identically to `removeFeaturedAthlete` and every action in the other two files. Match the existing gated style in `src/app/admin/players/actions.ts`.)

**7b. Admin pages** — for each: ensure the page redirects non-admins (`const admin = await getAdminUser(); if (!admin) redirect("/");` — copy the exact pattern used in `src/app/admin/players/page.tsx`), replacing any local `ADMIN_EMAILS` const with the helper; then move the flagged queries to `createAdminClient()`:

| File | Move to service role |
|---|---|
| `src/app/admin/page.tsx` | the five cookie-client counts (`stat_verifications`, `scout_applications`, `highlight_submissions`, `events`, `contact_submissions`) → the existing `adminDb` |
| `src/app/admin/verifications/page.tsx` | pending + recent `stat_verifications` reads |
| `src/app/admin/messages/page.tsx` + `actions.ts` | `contact_submissions` reads/writes (gates already correct — keep) |
| `src/app/admin/players/[id]/edit/page.tsx` | `players` read (gate already correct) |
| `src/app/admin/rankings/page.tsx` | `players` read (`ranking_snapshots` read may stay on cookie client) |
| `src/app/admin/featured/page.tsx` | `featured_athlete` + `players` reads |
| `src/app/admin/highlights/page.tsx` | `highlight_submissions` reads |
| `src/app/admin/events/page.tsx` | `events` reads |
| `src/app/admin/events/[id]/results/page.tsx` | `events` + `event_results` reads |
| `src/app/admin/scouts/page.tsx` | `scout_applications` reads |
| `src/app/admin/coaches/page.tsx` | no client change needed (public-read policy works); just normalize gating if it uses a local ADMIN_EMAILS |

**7c. Admin API routes:**

| File | Change |
|---|---|
| `src/app/api/scouts/approve/route.ts` | ⚠️ trap file: `createServerClient` here IS the cookie client (aliased import). Keep it for `getUser` only; move `scout_applications` read + update to `createAdminClient()`; the `scouts` upsert already uses an inline service client — switch it to the same `db` for consistency. Ensure `isAdminEmail` gate (it imports it — verify it's actually called). |
| `src/app/api/admin/coaches/route.ts` | replace local `adminEmails` with `isAdminEmail`; move the coaches UPDATE to `createAdminClient()` (owner-only policy blocks admin updates). The GET/read part can stay cookie (public read). |
| `src/app/api/admin/recompute-rankings/route.ts` | replace local `ADMIN_EMAILS` with `isAdminEmail` (keep the `CRON_SECRET` path). Then verify the recompute call chain uses a service client: `grep -rn "createAdminClient\|createServerClient" src/lib/rankings src/lib/eval | grep -i recompute` — if the recompute function receives or constructs a cookie client, switch it to `createAdminClient()` (it writes `ranking_snapshots`, which has read-only policy). |

**Step 2: Verify** — both guard tests fully green now, plus build:

```bash
npx vitest run src/lib/supabase/usage-guard.test.ts src/lib/admin-gating.test.ts
npm run build
```

Expected: PASS, PASS, clean build. If usage-guard still lists files not covered by Tasks 3–7, fix them by the same rules (that's the point of the test — it is the source of truth, not this inventory).

**Step 3: Commit**

```bash
git add src/app/admin src/app/api/admin src/app/api/scouts/approve
git commit -m "fix+security: admin surfaces — canonical gating everywhere + service-role data access"
```

---

## Task 8: Full-suite verification + advisor re-check

**Step 1: Everything green**

```bash
npm test          # ALL tests incl. both new guards
npm run build     # clean
```

**Step 2: Manual smoke against the dev server** (`.claude/launch.json`, port 3000 — use preview tools). Verify with a real browser/preview, not assumptions:

1. Homepage: Featured Athlete section, Top-10 Plays teaser, Latest Results teaser all render data (they were empty before).
2. `/plays`, `/results`, `/athletes/featured` show content.
3. Signed in as a member who claimed a profile: `/dashboard/edit` loads the profile; recruiting toggle on the dashboard persists after reload (Bug #1).
4. Signed in as admin (`talkinflagshow@gmail.com` or env-listed): `/admin` badge counts non-zero where data exists; `/admin/verifications` lists pending items; approving one sets the ✓ on the player profile (Bug #2).
5. Signed in as a NON-admin member: visiting `/admin/featured` redirects away; invoking an admin action (e.g. via the UI if reachable, or by POSTing the server action) returns "Not authorized".
6. Anonymous: `/admin/*` pages redirect.

**Step 3: Supabase advisors** — re-run security advisors (MCP `get_advisors`, project `wxeuybksowhncalrnttl`). Expected end state: only the 15 expected `rls_enabled_no_policy` INFO items + 2 accepted WARNs (`extension_in_public` vector — owner-deferred; `auth_leaked_password_protection` — owner dashboard action). Anything else: investigate before shipping.

**Step 4: Commit any smoke-test fixes, then finish**

```bash
git add -A && git commit -m "test: smoke-test fixes from pre-launch verification"  # only if needed
```

---

## Task 9: Docs + handoff

**Files:**
- Modify: `CLAUDE.md` (Open Items section)
- Modify: `docs/plans/2026-06-23-security-hardening.md` (append a dated note that the RLS-client sweep + admin-gating unification shipped, with commit hashes)

**Step 1:** Update both docs. In CLAUDE.md, add under Open Items:

```markdown
> ✅ **RLS client sweep + admin gating (2026-07-03):** all cookie-client access to
> zero-policy tables eliminated; enforced by `src/lib/supabase/usage-guard.test.ts`
> and `src/lib/admin-gating.test.ts` — if you add a table or an admin surface,
> those tests tell you the rules. Cookie client = auth + policy-backed tables ONLY.
```

**Step 2:** Final report to the owner must include these **owner actions before the stress test**:
1. Set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in Vercel — upgrades the per-IP rate limiter from per-instance-memory to shared Redis (matters under load).
2. Enable leaked-password protection: Supabase Dashboard → Auth → Policies (2 clicks; not scriptable).
3. Confirm `ADMIN_EMAILS` is set in Vercel env (the hardcoded fallback works but env is canonical).
4. `CRON_SECRET` + `RESEND_API_KEY` still pending from previous sessions (approval emails in the fixed routes silently no-op without Resend).

**Step 3: Merge** — use superpowers:finishing-a-development-branch (merge `rls-sweep` → `main`, push; Vercel auto-deploys). Re-run the smoke list from Task 8 against production after deploy.

**Step 4: Commit docs**

```bash
git add CLAUDE.md docs/plans/2026-06-23-security-hardening.md
git commit -m "docs: record RLS client sweep + admin gating unification"
```
