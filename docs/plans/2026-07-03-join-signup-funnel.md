# Join / Sign-Up Funnel — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> **Depends on:** `docs/plans/2026-07-03-claim-safety-notify-report.md` Task 1 (`claim_events` table) — build that migration first, or fold both migrations into one pass.

**Goal:** Right now there is no visible way for a website visitor to become a member. The homepage has zero player-facing CTAs; the nav only has "Submit Profile" and no Sign In/Dashboard link at all. The existing `/players/submit` form is public (no login), and — despite its own copy claiming "profiles are reviewed before appearing" — actually inserts straight into the live public database with **no approval gate whatsoever** (verified in `src/app/api/players/submit/route.ts`: no `is_approved` column exists, no pending queue, nothing).

This plan replaces that with one clear **"Join Talkin Flag"** front door that (a) requires sign-in before anyone can create a profile, (b) never lets someone submit a profile on another person's behalf — the signed-in account *is* the athlete, full stop, (c) links a self-created profile to the creator's account from the moment it's created (no separate claim step, no ownership ambiguity — this also closes the impersonation gap from the claim-safety plan for this path entirely), and (d) adds a real approval gate before self-submitted profiles go public, matching the pattern already used for events/career-updates.

**Explicitly rejected:** keeping the submit form anonymous/public (owner decision — "They can't submit a profile if they are not registered or signed up... not submitting profiles for others").

---

## Task 1: DB migration — `players.is_approved` + `claim_events.note`

**Files:** `supabase/migrations/010_join_funnel.sql` (numbered after the claim-safety migration)

```sql
alter table players add column is_approved boolean not null default true;
-- default TRUE so every existing path (admin add, import scripts, the 374
-- already-live players) keeps working without changes; only the new
-- self-submit route explicitly opts a row into false/pending.

alter table claim_events add column note text;
-- optional context string, e.g. 'self-registered new profile', shown in
-- the admin Recent Claims panel to distinguish from an existing-profile claim
```

**Commit:** `feat(db): players.is_approved gate + claim_events.note`

---

## Task 2: Rework `/api/players/submit` — auth-required, self-only, pre-linked

**Files:** Modify `src/app/api/players/submit/route.ts`

- Add auth check at the top (`createClient()` cookie client, `auth.getUser()`) — `401` if not signed in.
- **Block re-submission:** if this user already has a `players` row with `claimed_by = user.id`, return `409 { error: "You already have a profile." }` (reuses the same one-profile-per-account rule from the claim-safety plan's Task 2 — implement that check once, share it).
- On insert, set `is_claimed: true, claimed_by: user.id, claimed_at: now(), is_approved: false` (was previously unclaimed and had no approval concept at all).
- After a successful insert, insert into `claim_events`: `{ player_id: <new id>, user_id: user.id, action: 'claim', actor: 'self', note: 'self-registered new profile' }`.
- Notify admin via `sendEmail()` (same as claim-safety Task 2's pattern) — subject "New player registration pending review."
- Remove the honeypot/anonymous-specific defenses that no longer make sense once auth-gated (keep rate limiting — an authenticated account script-spamming submissions is still worth throttling).

**Build check:** `npm run build`

**Commit:** `feat(submit): require auth, self-only, pre-link to account, pending approval`

---

## Task 3: Gate the submit page + fix the copy

**Files:** Modify `src/app/players/submit/page.tsx` (+ its `layout.tsx` if needed)

- Server-check auth at the top of the page; if not signed in, redirect to `/auth/login?next=/players/submit`.
- Remove any implication this is for adding someone else — form is framed as "your" profile throughout (mostly already is).
- Fix the success-state copy: "Thanks — this is now true" — replace "Our team will review and add you to the database within 48 hours" with something accurate reflecting the real gate, and mention they can see/edit it from `/dashboard` immediately while it's pending (since it's already linked to their account).

**Build check:** `npm run build`

**Commit:** `fix(submit): auth-gate the page, correct pending-review copy`

---

## Task 4: Public visibility respects `is_approved`

**Files:** `src/app/players/page.tsx` (list/search), `src/app/players/[id]/page.tsx` (detail), sitemap, any other public query against `players` (`similar_players` RPC, `/api/players/search`, rankings eligibility)

- All **public-facing** reads add `.eq("is_approved", true)`.
- The **owner's own view** (dashboard) is unaffected — it queries by `claimed_by = user.id` regardless of `is_approved`, so they can see and keep editing their pending profile.
- A direct link to an unapproved profile's public page (`/players/[id]`) should behave like "not found" for everyone except the owner (check `claimed_by === currentUser?.id` server-side before rendering; otherwise 404-style not-found).

**Build check:** `npm run build`

**Commit:** `fix(players): hide unapproved self-submitted profiles from public views`

---

## Task 5: Admin — pending review queue

**Files:** Modify `src/app/admin/players/page.tsx` + `src/app/admin/players/actions.ts`

- Add a "Pending Review" filter/tab showing `is_approved = false` rows.
- **Approve action:** `is_approved = true`; optionally email the owner (if `RESEND_API_KEY` set) that they're live.
- **Reject action:** reuse existing `deletePlayer` — since this is the person's own self-submitted, not-yet-public row, deleting it is the correct "reject" (no orphaned public data, no dangling claim). Email the owner why, if a reason field is added — keep this simple for v1, a generic rejection email is fine, don't over-build a reason-picker.
- Add a pending-count card on `/admin` home, same pattern as the existing Career Updates / Events pending-count cards.

**Build check:** `npm run build`

**Commit:** `feat(admin): pending player-registration review queue`

---

## Task 6: The `/join` front door

**Files:** Create `src/app/join/page.tsx`

Server component, routes based on state:
1. **Not signed in** → sign-in prompt with `next=/join` (reuse the existing login page, just linked here).
2. **Signed in, already has a claimed player** → redirect to `/dashboard`.
3. **Signed in, has a pending (`is_approved=false`) self-submitted player** → show a "Your profile is under review" status card with a link to `/dashboard` (where they can keep editing it) instead of the two-choice screen below.
4. **Signed in, no player linked yet** → two clear choices:
   - **"Find Your Profile"** — most national/college/HS athletes are likely already seeded; link to `/players` search (existing claim flow, unchanged by this plan).
   - **"Create Your Profile"** — link to `/players/submit` (now auth-gated per Task 3).

**Build check:** `npm run build`

**Commit:** `feat(join): unified sign-up front door routing claim vs create`

---

## Task 7: Homepage CTA

**Files:** Modify `src/app/page.tsx` (+ a new component if the section is non-trivial, e.g. `src/components/home/JoinCTA.tsx`)

- New section, positioned after the hero (don't disrupt the existing twins hero) — headline along the lines of "Get Discovered — Join the Database," short supporting line (coaches/scouts/national selectors reach, free), single primary button → `/join`.
- Keep visual language consistent with the existing brand (yellow/black, `font-display uppercase tracking-widest`, same button style used elsewhere).

**Build check:** `npm run build`

**Commit:** `feat(home): add Join CTA section`

---

## Task 8: Nav — unify CTA + add Sign In/Dashboard link

**Files:** Modify `src/components/layout/Nav.tsx`, `src/components/layout/Footer.tsx`

- Replace the "Submit Profile" button (desktop + mobile) with **"Join"** → `/join`.
- Add a lightweight auth-aware link next to it: fetch the current session client-side (same pattern already used for the `isAdmin` check via `/api/admin/check` — add a tiny equivalent or reuse `createClient().auth.getUser()` client-side) and show **"Dashboard"** if signed in, **"Sign In"** if not. This currently doesn't exist anywhere in the nav — signed-in non-admin users have no way back to their dashboard from the nav today.
- Update Footer's "Submit Profile" label/link → point at `/join` instead of `/players/submit` directly (so footer visitors also go through the smart router, not straight to a form they might not need if they're already in the database).

**Build check:** `npm run build`

**Commit:** `feat(nav): unify Join CTA, add Sign In/Dashboard link`

---

## Task 9: Verification

No staging environment — verify against live `wxeuybksowhncalrnttl`, same approach as prior sessions:
1. `npm run build` + `npm test` green.
2. DB-level dry run: insert a throwaway self-submitted player row as if through the new route (`is_claimed=true, claimed_by=<test account>, is_approved=false`), confirm it does **not** appear in a query matching the public `/players` list filter (`is_approved=true`), confirm it **does** appear in a query matching the dashboard filter (`claimed_by=<test account>`, no `is_approved` condition). Simulate admin approve (`is_approved=true`) and confirm it now matches the public filter. Simulate reject (delete) and confirm it's gone. Clean up any leftover rows.
3. Confirm the "second submission blocked" rule: attempt a second self-submit dry run for an account that already has a claimed player, confirm the 409 condition would trigger (same query pattern as claim-safety Task 6).
4. Manual pass once deployed: sign in fresh, hit `/join`, confirm both branches (find vs create) render correctly, confirm nav shows "Sign In" when signed out and "Dashboard" when signed in.
