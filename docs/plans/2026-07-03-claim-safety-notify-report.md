# Claim Safety: Notify, Cap, Report — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Right now, claiming a player profile has zero identity verification — any signed-in account (any email) can claim any unclaimed profile and get full write access to it (bio, photo, stat-verification requests). This plan adds **detection + fast recovery**, not identity-verification prevention: instant claim is preserved (no onboarding friction for this week's teammate test), but every claim is capped, logged, and surfaced to admins, and the public gets a way to flag a wrong claim.

**Explicitly rejected approach:** identity verification (photo ID, phone OTP tied to a real name, matching to an on-file roster email) — disproportionate for a sports community site and itself a privacy/compliance liability (collecting ID documents you don't need). Data minimization: this plan adds no new PII collection beyond an optional free-text reason on a report.

**Architecture pattern:** Mirrors what's already in this codebase for events/career-updates/scouts — `players` and the two new tables have RLS enabled with zero policies (service-role only), consistent with `docs/plans/2026-07-02-fix-claim-flow-and-teammate-testing-prep.md`'s established convention. Admin notification reuses `src/lib/email.ts`'s `sendEmail()` (Resend). Rate limiting reuses `src/lib/rate-limit.ts` (same 5/min/IP pattern already on `/api/contact`, `/api/newsletter`, `/api/players/submit`, `/api/events/submit`).

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (Postgres + RLS), Resend, Vitest.

---

## Task 1: DB migration — `claim_events` audit log + `profile_reports`

**Files:** Create `supabase/migrations/009_claim_safety.sql`

```sql
create table claim_events (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('claim', 'release')),
  actor text not null check (actor in ('self', 'admin')),
  created_at timestamptz not null default now()
);
alter table claim_events enable row level security;
-- no policies: service-role only, same convention as every other table here

create table profile_reports (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  reason text,
  reporter_email text,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
alter table profile_reports enable row level security;
-- no policies: service-role only
```

Apply via Supabase MCP `apply_migration`.

**Commit:** `feat(db): claim_events audit log + profile_reports table`

---

## Task 2: Harden the claim route

**Files:** Modify `src/app/api/players/[id]/claim/route.ts`

Add, in order, before the existing update:
1. **Rate limit** — reuse `src/lib/rate-limit.ts` the same way `/api/players/submit` does (5/min/IP, 429 + Retry-After on breach).
2. **One active claim per account** — before the update, query `players` for any row with `claimed_by = user.id` and `is_claimed = true`. If one exists, return `409 { error: "You've already claimed a profile. Contact us if you need to change it." }`.
3. On successful claim (after the existing update succeeds), **insert into `claim_events`**: `{ player_id: id, user_id: user.id, action: 'claim', actor: 'self' }`. Fire-and-forget — log and swallow errors, don't fail the claim if this insert fails.
4. On successful claim, **notify admin** via `sendEmail()` (`ADMIN_EMAILS`, subject "New profile claim: {first} {last}", body includes player name/id, claimer email, timestamp, plus a direct link to `/admin/claims`). Wrap in try/catch — don't fail the claim if Resend errors or `RESEND_API_KEY` isn't set.

**Build check:** `npm run build`

**Commit:** `feat(claim): rate-limit, one-claim-per-account cap, audit log, admin notify`

---

## Task 3: Admin — Recent Claims panel

**Files:** Create `src/app/admin/claims/page.tsx` (+ reuse `toggleClaim` from `src/app/admin/players/actions.ts`)

- Server component, admin-gated (`getAdminUser()`, same as every other `/admin/*` page).
- Query `claim_events` (service-role client) joined to `players` (name) — most recent 50, newest first. Show action (claim/release), actor, player name+link, the claiming user's email (join `auth.users` via service-role — admin-only surface, this is exactly the kind of internal-only PII exposure that's appropriate here), timestamp.
- Each `action='claim'` row where the player is still claimed gets a one-click **"Release"** button calling `toggleClaim(playerId, false)`.
- Add a nav link from `/admin` home (small card, same pattern as the Career Updates pending-count card) so admins actually find this without hunting for a URL.

**Build check:** `npm run build`

**Commit:** `feat(admin): Recent Claims panel with one-click release`

---

## Task 4: Public "Report this profile" + admin review

**Files:**
- Create `src/app/api/players/[id]/report/route.ts` (POST, public, no auth required — reporting shouldn't require an account)
- Create `src/components/players/ReportProfileButton.tsx` (small link/modal on `/players/[id]`)
- Modify `src/app/players/[id]/page.tsx` to render the button
- Create `src/app/admin/reports/page.tsx` + reuse `toggleClaim` for quick release

**Report route:** honeypot field + rate limit (same pattern as `/api/contact` — 5/min/IP), cap `reason` to 500 chars, optional `reporter_email` (254 cap, loose email format check, not required). Insert into `profile_reports` via service-role. On insert, notify admin via `sendEmail()` same as Task 2 (reuse a shared helper if it's more than a couple lines duplicated — otherwise duplication is fine, don't over-abstract for two call sites).

**Report button/modal:** small, low-visual-weight (e.g. "Not you? Report this profile" text link near the claim/edit area) — textarea for reason (optional), submit, success toast. No login gate.

**Admin reports page:** list `status='open'` reports newest-first, player name+link, reason, reporter email if given, timestamp. Actions: "Release Claim" (calls `toggleClaim(playerId, false)` + sets report `status='resolved', resolved_at=now()`), "Dismiss" (sets `status='dismissed'`, no claim change). Add a pending-count card on `/admin` home like the other queues.

**Build check:** `npm run build`

**Commit:** `feat(reports): public report-profile flow + admin review queue`

---

## Task 5: Admin release also logs to `claim_events`

**Files:** Modify `src/app/admin/players/actions.ts`'s `toggleClaim`

When releasing (`claimed === false`), before clearing the columns, read the current `claimed_by` off the row, then insert `{ player_id: id, user_id: <that claimed_by value>, action: 'release', actor: 'admin' }` into `claim_events`. This closes the loop so the audit trail shows who was released and when, not just who claimed.

**Build check:** `npm run build`

**Commit:** `feat(admin): log claim releases to audit trail`

---

## Task 6: Verification

No staging environment — verify against live `wxeuybksowhncalrnttl` the same way as the 2026-07-02 session:
1. `npm run build` + `npm test` green.
2. DB-level dry run: claim a throwaway player with the admin test account, confirm a `claim_events` row appears; attempt to claim a *second* throwaway player with the same account and confirm it's blocked with the 409; check `/admin/claims` shows both attempts correctly; release via the admin panel and confirm a `release` row appears; submit a report on a third throwaway player and confirm it shows in `/admin/reports`; dismiss it; clean up all throwaway data (reset players, delete the report/claim_event test rows).
3. Confirm the admin notification email path doesn't throw when `RESEND_API_KEY` is unset (it currently is) — the claim/report must still succeed even though no email actually sends.

---

## Explicitly out of scope (don't build)

- Any identity verification requiring new PII (ID upload, phone OTP, address).
- Matching claim email against an on-file roster contact — most flagsonly-imported players have no such contact on file, so this would only work inconsistently and add confusing rejection UX.
- Pre-claim approval queue (claim doesn't finalize until admin approves) — rejected for this rollout in favor of instant-claim + notify; revisit if abuse actually shows up in the audit log.
