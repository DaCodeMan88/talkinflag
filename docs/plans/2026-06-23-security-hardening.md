# Security Hardening Plan — 2026-06-23

Goal: prioritize safety and data protection. Fix **all** remaining issues from the
2026-06-23 security review. **Status: EXECUTED 2026-06-23 (P1–P3).**

## Execution summary (2026-06-23)
- **P1 — abuse protection (DONE, commit `ecec0b9`):** per-IP rate limiter
  (`src/lib/rate-limit.ts`, 5/min, 429+Retry-After; in-memory per-instance, auto-
  upgrades to Upstash if `UPSTASH_REDIS_REST_URL`/`_TOKEN` are set) on `/api/contact`
  + `/api/newsletter`; honeypot `website` field on both forms; newsletter real email
  regex + 254-char cap; contact admin-email HTML-escaped. +6 unit tests.
- **P2 — route audit + caps (DONE, commit `69023e1`):** audited every service-role
  route. Finding: `/api/players/submit` and `/api/events/submit` are ALSO public
  service-role writers (plan wrongly assumed only contact+newsletter). Added the
  same rate-limit + honeypot to both. All other service-role routes are gated —
  admin (`isAdminEmail`), user-scoped (`auth.getUser`), or `CRON_SECRET` (digest).
  Input caps on bio/names/school_or_team/instagram + range-validated stats were
  already present.
- **P3 — Supabase config (PARTIAL):**
  - DONE: dropped the `contact_submissions.service_insert` policy
    (`TO public WITH CHECK (true)`) — it let any anon-key client insert directly
    via PostgREST, bypassing the rate limit. Migration
    `drop_permissive_contact_insert_policy`. Cleared the `rls_policy_always_true`
    WARN. Contact form still works (route uses service role, bypasses RLS).
  - DEFERRED (owner decision 2026-06-23): move `vector` out of `public`. Practical
    exploit risk ~nil here (only trusted roles can CREATE in public); moving it on
    the live DB risks breaking `similar_players()` / SimilarPlayers with no staging.
    Left as an accepted WARN-level lint.
  - OWNER ACTION: enable leaked-password protection (Supabase → Auth → Policies).
    Low relevance (passwordless: magic-link + Google) but flip it on. Not
    MCP/SQL-reachable — dashboard only.

**Advisor state after P1–P3:** 2 WARNs remain by design — `extension_in_public`
(vector, deferred) and `auth_leaked_password_protection` (owner dashboard toggle).
The 10× `rls_enabled_no_policy` are expected INFO from the service-role architecture.

---

## Original plan (for reference)

Already fixed in commit `a878780` (do NOT redo): stored XSS via JSON-LD
(`src/lib/jsonld.ts` `safeJsonLd()` across all 15 sites), open redirect in
`/auth/callback`, PostgREST filter injection in `/api/players/search` +
`events/[id]`, admin-check unification on `isAdminEmail()`, and DB migration
`security_hardening_storage_and_functions` (dropped `player-photos` listing
policy, revoked EXECUTE on `rls_auto_enable`, pinned `similar_players`
search_path).

---

## Context: the security model (read first)
RLS is enabled on all tables with ~no policies, so the public **anon key cannot
read/write any app table**. ALL data access goes through the Next.js server using
the **service-role key** (server-only, `SUPABASE_SERVICE_ROLE_KEY`, not committed).
Consequence: **there is no DB safety net** — every route/server action is solely
responsible for its own authz. Keep this in mind for every change below.

---

## Priority 1 — Abuse protection on public write endpoints (do first)
These are unauthenticated POST routes that write to the DB with the service role.

- [ ] **Rate limiting.** Add per-IP throttling to `/api/contact` and
  `/api/newsletter` (and the magic-link request path if feasible). Options:
  Upstash Redis ratelimit (works on Vercel edge/serverless) or a lightweight
  in-memory/Vercel KV limiter. Decide on a store; Upstash is the standard pick.
- [ ] **Newsletter input validation** (`src/app/api/newsletter/route.ts`):
  replace the `email.includes("@")` check with a real email regex, cap length
  (e.g. ≤ 254 chars), reject obviously bogus input.
- [ ] **Contact form** (`src/app/api/contact/route.ts`): confirm field length
  caps exist on name/subject/message; add a **honeypot** hidden field and/or
  lightweight CAPTCHA (e.g. Cloudflare Turnstile) to both public forms.
- [ ] Consider tightening the `contact_submissions` `service_insert` RLS policy
  (currently `WITH CHECK true`). It's needed for the public form, so the real
  mitigation is the rate limit + honeypot above; document the decision.

## Priority 2 — Input validation / defense in depth
- [ ] Add server-side length/content caps on user-editable fields that get
  stored and re-displayed: player `bio`, `school_or_team`, names, instagram,
  `stats` JSON (cap size). Output XSS is already handled, but bounded input
  prevents storage abuse and oversized JSON-LD.
- [ ] Audit every `createServerClient()` (service-role) usage for: (a) is the
  route auth-gated where it should be, (b) is any user input used to build a
  query without scoping. Re-confirm `/api/newsletter` and `/api/contact` are the
  only intentionally-public service-role writers.

## Priority 3 — Supabase config / low severity
- [ ] **Enable leaked-password protection** (Supabase Auth → Policies). Low
  relevance today (passwordless: magic-link + Google) but enable for safety.
- [ ] **Move `vector` extension out of `public`** into a dedicated schema
  (e.g. `extensions`). CAUTION: `similar_players()` and the `profile_vector`
  column depend on it — test the KNN query + `/players/[id]` SimilarPlayers
  after moving. Possibly defer if risky.
- [ ] Re-run `get_advisors(security)` after each change; target zero WARN-level
  findings. The 10× `rls_enabled_no_policy` INFO notices are expected from the
  service-role architecture and can stay (or be replaced with explicit policies
  — see Priority 4).

## Priority 4 — Optional architectural improvement
- [ ] Consider adding **explicit RLS policies** (public read on public tables,
  owner-scoped writes) instead of relying solely on "service-role for
  everything". This restores a DB safety net so a single missing route check is
  no longer a full compromise. Large change — scope separately; only if time
  allows.

---

## Verification for each change
1. `npm run build` clean + `npm test` (34 tests) green.
2. `get_advisors(security)` shows the targeted finding cleared.
3. Manually exercise the affected endpoint (e.g. spam the contact form to confirm
   the rate limit returns 429; submit a valid newsletter signup still works).
4. Commit per-fix with a clear message; push to `main` (auto-deploys).

## Secrets note
Hygiene is currently clean: `.env*` gitignored, no keys committed, service-role
key server-only. Keep it that way — never add a secret to client (`NEXT_PUBLIC_`)
env or to the repo.

---

## Follow-up: RLS client sweep + admin-gating unification — SHIPPED 2026-07-03/04

Plan doc: `docs/plans/2026-07-03-rls-client-sweep-and-launch-hardening.md`. Branch
`rls-sweep` (from main `f1918c8`). Eliminated the entire "cookie-client vs
service-role client" bug class (many call sites queried RLS zero-policy tables via
the cookie/anon client → silent zero rows), closed the admin-authz holes the bug
was masking, and added two static regression guards so the class cannot reappear.

Commits:
- `d9aa1d8` plan · `66bb641`/`cb1d597` + `3df4e29`/`08279c9` the two red guard tests
  (`src/lib/supabase/usage-guard.test.ts`, `src/lib/admin-gating.test.ts`).
- `429a65d` Bug #1 recruiting toggle · `a3ce197` Bug #2 verification approval.
- `df89789` Group P public pages · `ba5ba1a` Group M member funnels.
- `3d0cb0b` Group A admin surfaces — **gate FIRST, then client swap**: 3 previously
  ungated server actions (featured/highlights/events-results) now use `getAdminUser`;
  all admin pages/routes unified onto `getAdminUser`/`isAdminEmail` from `@/lib/admin`
  (every local case-sensitive `ADMIN_EMAILS` const deleted, incl. `eval/eligibility.ts`);
  zero-policy + policy-hidden reads moved to `createAdminClient()`.

End state: both guards green, full suite 112 pass, build clean. Security advisors
unchanged — 15× `rls_enabled_no_policy` INFO (expected under this architecture) + 2
accepted WARN (`extension_in_public` vector, `auth_leaked_password_protection`).

**The rule going forward** (enforced by the two guards): the cookie client
(`@/lib/supabase/server`) is for `auth.getUser()` and policy-backed COOKIE_OK tables
ONLY; every zero-policy (service-only) table read/write uses a service-role client.
Every `/admin` + `/api/admin` surface must gate via `getAdminUser`/`isAdminEmail`
(or `CRON_SECRET` for cron routes) — middleware does NOT protect them.

### Owner actions before the stress-test launch
1. Set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in Vercel — upgrades the
   per-IP rate limiter from per-instance memory to shared Redis (matters under load).
2. Enable leaked-password protection: Supabase Dashboard → Auth → Policies (2 clicks).
3. Confirm `ADMIN_EMAILS` is set in Vercel env (hardcoded fallback works but env is canonical).
4. `CRON_SECRET` + `RESEND_API_KEY` still pending — approval/notification emails in the
   fixed routes silently no-op without Resend.

### Known follow-up (not built — out of scope for the sweep)
- **Recruiting-toggle UI gap:** `PATCH /api/players/[id]/recruiting` now works, but NO
  in-repo UI invokes it (no "open to recruiting" toggle on the dashboard). Candidate
  quick follow-up: a small toggle on the dashboard edit page.
