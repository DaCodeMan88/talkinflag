# Remove "Top 10 Plays" + "Athlete of the Week" Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fully remove the "Top 10 Plays of the Week" and "Athlete of the Week" (Featured Athlete) features from the site and admin, cleanly and without dead links, per Ambra's request to simplify ongoing maintenance.

**Architecture:** Delete the public routes, admin surfaces, homepage sections, nav/footer links, the player-facing submission form, and the two (currently empty) database tables. Add 301 redirects so old URLs don't 404. Prove completeness with a grep gate: zero references to the removed paths/components/tables remain.

**Tech Stack:** Next.js 15 App Router · TypeScript · Tailwind · Supabase · Vercel

---

## Why this is safe to remove wholesale

Both features are live but carry **zero data** — verified against production:

```sql
select 'featured_athlete' t, count(*) n from featured_athlete
union all select 'highlight_submissions', count(*) from highlight_submissions;
-- → featured_athlete: 0, highlight_submissions: 0
```

Nothing a user created is lost. (Note: `players.highlight_url` is a **different** thing — a player's own highlight-reel link on their profile. It is NOT part of this feature and must be left untouched.)

## Inventory — everything that must go

**Public routes (delete the directories):**
- `src/app/plays/` — `page.tsx` (the /plays hub) + `week/[week]/page.tsx`
- `src/app/athletes/` — `featured/page.tsx` + `featured/opengraph-image.tsx` (the whole `athletes/` tree is only the featured page)
- `src/app/api/highlights/` — `submit/route.ts`

**Admin surfaces (delete the directories):**
- `src/app/admin/highlights/` — `page.tsx`, `actions.ts`, `HighlightActions.tsx`, `PublishTop10Form.tsx`
- `src/app/admin/featured/` — `page.tsx`, `actions.ts`, `FeaturedForm.tsx`

**Homepage sections (remove usage + import):**
- `src/app/page.tsx` — remove `<FeaturedAthleteSection />` and `<Top10PlaysTeaser />` and their two imports
- Delete components `src/components/home/FeaturedAthleteSection.tsx` and `src/components/home/Top10PlaysTeaser.tsx`

**Player-facing submission (dashboard):**
- `src/app/dashboard/page.tsx` — remove the `HighlightSubmitForm` import + its render block (the "Highlight submission" section)
- Delete `src/app/dashboard/HighlightSubmitForm.tsx`

**Nav / footer / admin nav / admin overview:**
- `src/components/layout/Footer.tsx` — remove the two links: `Athlete of the Week` (→ `/athletes/featured`) and `Top 10 Plays` (→ `/plays`)
- `src/app/admin/AdminSidebar.tsx` — remove the `Featured Athlete` and `Highlights` nav items
- `src/app/admin/page.tsx` — remove the two admin cards/links (`href: "/admin/highlights"` and `href: "/admin/featured"`) plus any needs-attention counts or stat tiles that query `highlight_submissions` / `featured_athlete`

**Database (migration):**
- Drop tables `highlight_submissions` and `featured_athlete` (both empty)

**Redirects (next.config.ts):** `/plays`, `/plays/week/:week`, `/athletes/featured`, `/athletes` → a sensible live destination.

---

## Task 1: Confirm the full reference surface (no code change)

**Step 1:** Run the reference sweep and save the baseline so Task 8 can prove it's empty afterward.

```bash
grep -rnE "/plays|/athletes/featured|/athletes\b|/admin/highlights|/admin/featured|/api/highlights|Top10Plays|FeaturedAthleteSection|HighlightSubmitForm|highlight_submissions|featured_athlete" src next.config.ts | grep -v "highlight_url"
```

**Step 2:** Read each hit and confirm it belongs to one of the inventory buckets above. Any hit that is NOT in the inventory (e.g. an unexpected import) must be added to the task list before proceeding. Expected buckets: homepage, footer, admin sidebar, admin overview, dashboard, the route/component/api files themselves.

**Step 3:** No commit (investigation only). Proceed.

---

## Task 2: Remove the homepage sections

**Files:** Modify `src/app/page.tsx`; Delete `src/components/home/FeaturedAthleteSection.tsx`, `src/components/home/Top10PlaysTeaser.tsx`.

**Step 1:** In `src/app/page.tsx`, delete the two JSX usages `<FeaturedAthleteSection />` and `<Top10PlaysTeaser />` (and any wrapping `<ScrollReveal>`/`<Suspense>` that exists solely to wrap them — check the surrounding lines; if the wrapper also wraps other sections, keep it).

**Step 2:** Delete the two `import { FeaturedAthleteSection } …` and `import { Top10PlaysTeaser } …` lines.

**Step 3:** Delete the two component files.

**Step 4:** Verify the homepage still type-checks and builds:
```bash
npx tsc --noEmit
```
Expected: clean (no "cannot find name" errors — confirms no other file imports these).

**Step 5:** Commit.
```bash
git add -A && git commit -m "chore: remove Top 10 Plays + Featured Athlete homepage sections"
```

---

## Task 3: Remove the dashboard highlight-submission form

**Files:** Modify `src/app/dashboard/page.tsx`; Delete `src/app/dashboard/HighlightSubmitForm.tsx`.

**Step 1:** In `src/app/dashboard/page.tsx`, remove the `import { HighlightSubmitForm } from "./HighlightSubmitForm";` line and the JSX block that renders it (the section commented "Highlight submission" around the `<HighlightSubmitForm playerId={player.id} />` usage, including its heading/wrapper if that wrapper is only for this form).

**Step 2:** Delete `src/app/dashboard/HighlightSubmitForm.tsx`.

**Step 3:** Confirm `players.highlight_url` usage elsewhere in the dashboard is untouched (that's the profile field, not this feature). Grep to be sure nothing else referenced the form:
```bash
grep -rn "HighlightSubmitForm" src
```
Expected: no results.

**Step 4:** `npx tsc --noEmit` → clean. Commit.
```bash
git add -A && git commit -m "chore: remove player highlight-of-the-week submission form"
```

---

## Task 4: Delete the public routes + API

**Files:** Delete directories `src/app/plays/`, `src/app/athletes/`, `src/app/api/highlights/`.

**Step 1:** Delete all three directories.
```bash
git rm -r src/app/plays src/app/athletes src/app/api/highlights
```

**Step 2:** Grep for any remaining links into them (should already be gone after Tasks 2–3, except footer which is Task 6):
```bash
grep -rnE "/plays|/athletes/featured|/api/highlights" src
```
Expected: only the footer links remain (removed in Task 6). If anything else appears, resolve it now.

**Step 3:** `npx tsc --noEmit` → clean. Commit.
```bash
git add -A && git commit -m "chore: delete /plays, /athletes/featured, /api/highlights routes"
```

---

## Task 5: Delete the admin surfaces + overview cards

**Files:** Delete `src/app/admin/highlights/`, `src/app/admin/featured/`; Modify `src/app/admin/AdminSidebar.tsx`, `src/app/admin/page.tsx`.

**Step 1:** Delete the two admin directories.
```bash
git rm -r src/app/admin/highlights src/app/admin/featured
```

**Step 2:** In `src/app/admin/AdminSidebar.tsx`, remove the `{ label: "Featured Athlete", href: "/admin/featured" }` and `{ label: "Highlights", href: "/admin/highlights" }` nav items from the NAV array. If removing them empties a group, remove the now-empty group.

**Step 3:** In `src/app/admin/page.tsx`, remove the two cards/links targeting `/admin/highlights` and `/admin/featured`, plus any `createAdminClient().from("highlight_submissions"|"featured_athlete")` count queries and the stat tiles / needs-attention chips that display them. Keep every other card intact.

**Step 4:** Verify no admin code still references the tables:
```bash
grep -rnE "highlight_submissions|featured_athlete|/admin/highlights|/admin/featured" src/app/admin
```
Expected: no results.

**Step 5:** `npx tsc --noEmit` → clean. Commit.
```bash
git add -A && git commit -m "chore: remove admin Highlights + Featured Athlete surfaces"
```

---

## Task 6: Remove the footer links

**Files:** Modify `src/components/layout/Footer.tsx`.

**Step 1:** Remove the two link entries (`Athlete of the Week` → `/athletes/featured`, `Top 10 Plays` → `/plays`). If they lived in a footer column that is now empty, collapse/rebalance the columns so the layout stays even.

**Step 2:** `npx tsc --noEmit` → clean. Commit.
```bash
git add -A && git commit -m "chore: remove Top 10 Plays + Athlete of the Week footer links"
```

---

## Task 7: 301 redirects for retired URLs

**Files:** Modify `next.config.ts`.

**Step 1:** Add redirects to the `redirects()` array (create the function if it doesn't exist — the repo already uses it for the `/episodes`→`/podcast` rename, so follow that exact pattern):

```ts
{ source: "/plays", destination: "/players", permanent: true },
{ source: "/plays/week/:week", destination: "/players", permanent: true },
{ source: "/athletes/featured", destination: "/players", permanent: true },
{ source: "/athletes", destination: "/players", permanent: true },
```

> Rationale: `/players` is the closest live equivalent (athlete discovery). If the owner prefers the homepage, use `/` — this is a one-line owner preference, note it but default to `/players`.

**Step 2:** Build and confirm the redirects compile:
```bash
npm run build
```
Expected: green; the build output lists the redirects.

**Step 3:** Commit.
```bash
git add next.config.ts && git commit -m "chore: 301 retired /plays + /athletes URLs to /players"
```

---

## Task 8: Drop the empty database tables

**Files:** Create `supabase/migrations/024_drop_highlights_featured.sql`.

**Step 1:** Re-confirm both tables are still empty before dropping (guard against a race where something wrote a row mid-work):
```sql
select count(*) from highlight_submissions;  -- must be 0
select count(*) from featured_athlete;        -- must be 0
```
Run via the Supabase MCP `execute_sql`. If either is non-zero, STOP and surface to the owner — do not drop.

**Step 2:** Write the migration file:
```sql
-- Retire the Top 10 Plays + Athlete of the Week features (owner request 2026-08-02).
-- Both tables verified empty before drop. Applied via Supabase MCP.
DROP TABLE IF EXISTS highlight_submissions;
DROP TABLE IF EXISTS featured_athlete;
```

**Step 3:** Apply via the Supabase MCP `apply_migration` (name `024_drop_highlights_featured`).

**Step 4:** Verify they're gone:
```sql
select table_name from information_schema.tables
where table_name in ('highlight_submissions','featured_athlete');
-- → zero rows
```

**Step 5:** Commit.
```bash
git add supabase/migrations/024_drop_highlights_featured.sql && git commit -m "chore: drop empty highlight_submissions + featured_athlete tables"
```

---

## Task 9: Completeness gate + full verification

**Step 1:** The reference sweep from Task 1 must now be empty (excluding the profile field `highlight_url` and this plan/CLAUDE.md docs):
```bash
grep -rnE "/plays|/athletes/featured|/athletes\b|/admin/highlights|/admin/featured|/api/highlights|Top10Plays|FeaturedAthleteSection|HighlightSubmitForm|highlight_submissions|featured_athlete" src next.config.ts | grep -v "highlight_url"
```
Expected: **no results.** Any hit means an incomplete removal — fix before finishing.

**Step 2:** Full green gate:
```bash
npx tsc --noEmit && npx vitest run && npm run build
```
Expected: tsc clean, all tests pass, build green.

**Step 3:** Local click-through (dev server): homepage no longer shows either section and doesn't error; footer has no dead links; `/plays` and `/athletes/featured` 301 to `/players`; `/admin` overview + sidebar have no Highlights/Featured entries; the dashboard has no highlight-submission form. Confirm at 375px too.

**Step 4:** Update `CLAUDE.md`: mark "Athlete Profile of the Week" (Traffic Growth Roadmap phase B) and "Top 10 Plays of the Week" (phase C) as **REMOVED 2026-08-02 (owner request)** so the roadmap history is accurate.

**Step 5:** Finish the branch with `superpowers:finishing-a-development-branch`.

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| A stray import of a deleted component slips through → build break | `npx tsc --noEmit` after every task catches it immediately; Task 9 grep gate is the backstop. |
| Old `/plays` URLs indexed by Google → 404s hurt SEO | 301 redirects (Task 7) to `/players`. |
| Dropping a table that quietly gained a row | Task 8 Step 1 re-checks emptiness immediately before the drop. |
| Removing a footer/admin item leaves an empty container | Each task explicitly rebalances/collapses an emptied group. |
| Confusing `players.highlight_url` (keep) with the feature (remove) | Every grep excludes `highlight_url`; called out in Tasks 1 & 3. |
