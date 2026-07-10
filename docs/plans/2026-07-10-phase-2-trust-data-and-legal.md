# Phase 2 — Trust, Data Quality & Legal Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix everything Ambra & Tika reported in the July testing round (profile discrepancies, uneditable/wrong data, blog CTA misrepresentation, monotonous eval answers), finish Phase 2 of the 2026-07-06 stress-test plan, and close the urgent legal gaps (no privacy policy/terms, no data-source notice for scraped profiles).

**Architecture:** Next.js 16 App Router + Supabase (RLS zero-policy tables → ALL `players` writes via `createAdminClient()` service-role client; cookie client is auth + policy-backed tables only — enforced by `src/lib/supabase/usage-guard.test.ts`). Resend email (now loud), Vercel hosting.

**Tech Stack:** Next 16.2.6, React 19, Supabase JS v2, Tailwind, Vitest.

---

## Session-state audit (2026-07-10) — read this first, do not redo work

- **Phase 1 of `docs/plans/2026-07-06-stress-test-audit-and-fixes.md` is DONE and live** (`eedcc4e` email pipeline, `a8d1561` content quick-wins; verified on production 7/7). Any saved resume prompt about email pipeline, find-a-league links, partners, positions, Spotify ID config, or claim-redirect is **stale — do not re-execute**.
- **The CLAUDE.md kickoff prompt ("…execute Phase A" of the community-rankings master plan) is STALE** — Phases A–F all shipped weeks ago. Ignore it; Task 10 fixes CLAUDE.md.
- **Phase 2 of the stress-test plan was NEVER executed** (no commits after `a8d1561`). This plan is Phase 2, expanded with the new Ambra/Tika feedback.
- **Working tree has 2 pre-existing uncommitted files** (`CLAUDE.md`, `docs/ambra-update-2026-06-25.md`) — handled in Task 0.
- **Root cause of "our bios are different" (verified via live SQL 2026-07-10):** the public profile renders sections conditionally on which `stats` JSONB keys exist. Ambra's row has `caps, tournaments, world_appearances, years_active, achievements, education, occupation, roster_year, team_designation`; Tika's has `jersey, club, nickname, instagram, age_at_ffwc24, achievements, education, occupation, roster_year, team_designation`. The dashboard edit form covers only a fixed subset of fields → "different profiles, same edit form." Also Ambra's page contradicts itself: hero shows **24 world caps** (`stats.caps=24`) while her career-highlights text says **34 international caps**.
- **Open owner actions (not code, surface in final report):** correct Spotify Show ID from Ambra (`033GcNgIw5FPNMr69P5sDU` is a hard 404 — env var was removed 7/7); 5 YouTube video IDs for `TODO_OWNER` placeholders; Printful+Stripe keys in Vercel (Stripe blocked on US business formation — see legal review); Amazon tag (paused).

**Scope decision (recommended, confirm with Daniel at Task 3 if he's present; otherwise proceed with the recommendation):** claimed players get **full self-edit** of career highlights, tournament history, and the key-stat fields their profile renders — with edits to `caps/world_appearances/tournaments` clearing `is_verified` back to false pending admin re-approval. Rationale: "report incorrect info → admin fixes" already exists (`profile_reports`) and Ambra/Tika explicitly asked to edit their own sections; the verification reset preserves data trust.

---

### Task 0: Commit housekeeping + working-tree cleanup

**Files:**
- Review: `CLAUDE.md`, `docs/ambra-update-2026-06-25.md` (pre-existing uncommitted edits)

**Step 1:** `git diff CLAUDE.md docs/ambra-update-2026-06-25.md` — read the diffs. They are documentation-only updates from the 7/5 session (owner-action list rewrite).
**Step 2:** If the diffs are doc-only (expected): `git add CLAUDE.md docs/ambra-update-2026-06-25.md && git commit -m "docs: owner-action list updates from 2026-07-05 session"`. If anything in the diff touches code, stop and surface it instead.
**Step 3:** Commit this plan: `git add docs/plans/2026-07-10-phase-2-trust-data-and-legal.md && git commit -m "docs: phase 2 trust/data/legal plan"`.

### Task 1: Blog footer CTA — remove implied interviews (Ambra's exact request)

**Files:**
- Modify: `src/app/blog/[slug]/page.tsx:337-338`

**Step 1:** Replace the footer CTA copy. Current:
```tsx
<p className="font-display text-xs uppercase tracking-widest text-brand-yellow mb-1">Listen Now</p>
<p className="text-brand-white/60 text-sm">Explore the episodes that inspired this story.</p>
```
New:
```tsx
<p className="font-display text-xs uppercase tracking-widest text-brand-yellow mb-1">The Talkin Flag Show</p>
<p className="text-brand-white/60 text-sm">Explore all podcast episodes and listen now.</p>
```
("Explore the episodes that inspired this story" falsely implies the post's subjects were interviewed — Ambra: "we have not interviewed them.")

**Step 2:** Sweep for other implied-interview copy: `grep -rn "inspired this story\|our conversation with\|sat down with\|told us" src/lib/static-posts.ts src/app/blog src/components`. Fix any hits the same way (neutral podcast CTA; never claim an interview happened). The 5 interview posts (Sowers/Clark-Robinson/Krouch/Doucette/Flores) are editorial paraphrase — verify none claims a first-person interview.

**Step 3:** `npm run build` → green. Commit: `git commit -m "fix: blog CTA no longer implies subjects were interviewed"`.

### Task 2: Profile render fix — no grey blocks, no placeholder stats

**Files:**
- Read first: `src/app/players/[id]/page.tsx` (profile sections: hero key-stats bar, Athleticism grid, Stats panel)
- Modify: same file (and any stat-block subcomponents it imports)
- Test: `src/lib/profile-visibility.test.ts` (new)

**Step 1:** Write failing test for a new pure helper `hasDisplayableValue(v: unknown): boolean` in `src/lib/profile-visibility.ts` — returns false for `null`, `undefined`, `""`, `"?"`, `"N/A"`, `0`-as-unset is NOT filtered (0 caps is legit only if explicitly set; treat `0` as displayable), true otherwise. Run `npx vitest run src/lib/profile-visibility.test.ts` → FAIL.
**Step 2:** Implement the helper. Test passes.
**Step 3:** In the profile page, gate every stat tile/section: a tile whose value fails `hasDisplayableValue` renders nothing (skip the tile entirely, not an empty grey block); a section (Athleticism grid, Stats panel, Tournament History) with zero displayable entries renders nothing at all. This is what fixes Ambra's "grey block where I added no info."
**Step 4:** In the profile-edit API route (find via `grep -rn "PATCH" src/app/api/players` — the dashboard edit route), coerce empty-string/`"?"` inputs to `null`/key-deletion before writing `stats` so unset fields never persist as placeholders. Writes stay on the service-role client.
**Step 5:** `npm run build && npx vitest run` → green. Manual check: `npm run dev`, load `/players/ab5214c7-17bf-4f63-ab38-6a6ebe1c9d2c` and `/players/7cdcd6a2-7cf9-4dcf-8993-1f426b4c2b24` — no empty blocks.
**Step 6:** Commit: `git commit -m "fix: profile hides unset stats instead of rendering placeholders/grey blocks"`.

### Task 3: Profile edit parity — claimed players can edit what their profile shows

**Files:**
- Read first: `src/app/dashboard/edit/page.tsx` + its form component + the PATCH route it posts to
- Modify: those files
- Test: extend the route's existing test if present; otherwise unit-test the new payload-sanitizer

**Step 1:** Extend the dashboard edit form with the missing sections (per scope decision above): **Career Highlights** (`stats.achievements[]` — add/edit/remove strings), **Tournament History** (`stats.tournaments[]`), and the key stat fields rendered by the profile (`caps`, `world_appearances`, `years_active`, `jersey`, `club`, `nickname`, `instagram`, `education`, `occupation`). Every field optional; blank = key removed (Task 2's coercion).
**Step 2:** In the PATCH route: allowlist exactly those `stats` keys (never accept arbitrary keys like `team_designation`, `source`, `seed_batch` from the client); if `caps`/`world_appearances`/`tournaments`/`achievements` changed, set `is_verified=false` (re-verification gate). Service-role client for the write; ownership check (`claimed_by === user.id`) stays first.
**Step 3:** Unit test the sanitizer: allowlisted keys pass, others stripped, empty → deleted, verification-reset triggers on the right keys.
**Step 4:** `npm run build && npx vitest run` → green. Commit: `git commit -m "feat: claimed players can edit highlights, tournaments and key stats (verification resets on change)"`.

### Task 4: Ambra & Tika data corrections (SQL, immediate relief — no deploy)

**Files:** none (live Supabase `wxeuybksowhncalrnttl` via MCP `execute_sql`)

**Step 1:** Resolve the caps contradiction on Ambra's profile: her hero shows 24 (`stats.caps`), her highlights text says 34. **Ask Ambra which is correct** (owner question in final report); interim: make the two consistent by updating the achievements text to match `stats.caps` (single source of truth).
**Step 2:** Normalize the sisters' rows so both profiles render the same section set: add Ambra's missing `jersey`, `club: "FIDAF"`, `instagram: "ambramarcucci"`; add Tika's missing `caps`, `years_active` **only if values are known/confirmed — never invent numbers; leave unset otherwise** (Task 2 makes unset invisible, which is correct).
**Step 3:** Delete any remaining podcast-derived entries they flagged as wrong (their tournament history/highlights claims that can't be sourced). When in doubt, delete — absence renders as nothing now.
**Step 4:** Verify both live profile pages render cleanly. Record every SQL statement run in the final report (auditability).

### Task 5: Data-accuracy sweep (carried from stress-test plan Phase 2)

**Files:**
- Modify: `src/lib/world-rankings.ts` (static coach/player names), `scripts/data/iq-questions.json`
- Live DB: `coaches`, `players`, `iq_questions` rows

**Step 1:** Italy women head coach → **Jonathan Homer (UK)**; remove/supersede Katherine Sowers as current HC (keep her as historical reference only where dated). Update both the `coaches` row AND any static mention in `src/lib/world-rankings.ts` (`grep -n "Sowers\|Homer" src/lib/world-rankings.ts src/lib/static-posts.ts`).
**Step 2:** Mark Gianluca Santagostino inactive (he appears in Tika's "Other WR Players" rail — decide render rule: inactive players drop from active-roster rails). Update Vanita Krouch (cut from USA roster) the same way.
**Step 3:** Fix IQ Q10 ("Which of these is NOT a form of flag guarding?") in BOTH `scripts/data/iq-questions.json` and the live `iq_questions` row so seed and DB agree; make the NOT-option unambiguous.
**Step 4:** `npm run build` → green; verify /teams and /iq render. Commit: `git commit -m "fix: roster/coach accuracy sweep + IQ Q10"`.

### Task 6: Eval answer-scale variety (Ambra: "every answer is 'a lot' or 'it's decisive'")

**Files:**
- Modify: `scripts/data/eval-items.json` (every `style: "importance"` item currently uses the identical 5 labels: Not at all / Slightly / Moderately / A lot / It's decisive)
- Live DB: `eval_items` rows (reseed)

**Step 1:** Keep the 0–4 point scale (scoring untouched) but vary anchor labels by section so the survey doesn't read monotonous. Example sets — athleticism: `Irrelevant / Nice to have / Matters / Big factor / Separates elite players`; game IQ: `Not at all / A little / Meaningfully / Heavily / It defines the position`. Write 4–6 label sets and rotate per `section_key`. Labels must stay monotonic in intensity (they map to points 0–4).
**Step 2:** Reseed: find the eval seed script (`ls scripts | grep -i eval`), run it against the live DB (idempotent-check first — read the script; if it inserts rather than upserts, write the UPDATE SQL instead).
**Step 3:** Verify `/evaluate` renders the new labels; `npx vitest run src/lib/eval` → green (scoring tests must not depend on label text — if any do, that's a test bug, fix the test to use points).
**Step 4:** Commit: `git commit -m "feat: varied eval answer anchors per section (same 0-4 scoring)"`.

### Task 7: Share-card fix (carried from stress-test plan)

**Files:**
- Modify: `src/app/players/[id]/ShareCardModal.tsx`, `src/components/episodes/ShareButton.tsx`

**Step 1:** LinkedIn: replace legacy share URL with `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`.
**Step 2:** Mobile: call `navigator.share({ title, url })` directly inside the click handler guarded by `if (navigator.share)` (no async gap before the call — user-gesture requirement); fallback = copy-link + toast.
**Step 3:** Verify player page metadata emits `og:image` (LinkedIn pulls the card from OG tags). `npm run build` → green. Commit: `git commit -m "fix: LinkedIn share-offsite URL + guarded Web Share API"`. Flag in final report: needs a real-phone test by Daniel/Ambra.

### Task 8: Legal quick-wins — privacy policy, terms, data-source notice, removal path

**Files:**
- Create: `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`
- Modify: `src/components/layout/Footer.tsx` (add Privacy + Terms links), `src/app/sitemap.ts`, the unclaimed-profile banner component (find via `grep -rn "Unclaimed" src/components src/app/players`)

**Context (from legal review, `docs/legal-risk-review-2026-07-10.md`):** the site publishes personal data of ~374 real people — 284 scraped without their knowledge, many EU citizens (GDPR applies), some HS minors — collects emails, and runs Google OAuth, with **no privacy policy or terms anywhere**. Google's OAuth policy itself requires a linked privacy policy.

**Step 1:** Write `/privacy`: what data is collected (auth email, submitted profiles, contact/newsletter), sources of profile data (public rosters, federation sites, flagsonly.com — this is the GDPR Art. 14 source-disclosure), lawful basis (legitimate interest: sports reporting/statistics on public athletic performance), retention, and **how to correct or remove your profile** (link to the existing report-profile flow + contact email). Plain language, brand styling, "This is not legal advice reviewed by counsel — have an attorney review before monetization" NOT in the page itself (that goes in the report to Daniel).
**Step 2:** Write `/terms`: user submissions license, accuracy disclaimer ("statistics compiled from public sources, report errors"), no-warranty, rankings-are-editorial-opinion clause (defamation shield: TF Rank/IQ scores are methodology-driven opinion, methodology at /how-rankings-work), age 13+ requirement for accounts.
**Step 3:** Footer: add Privacy + Terms links (Connect column). Sitemap: add both routes.
**Step 4:** On unclaimed profiles, extend the existing "Is this you? Claim Profile" banner with one line: `Data compiled from public sources. <Link href="/privacy">How we handle athlete data</Link> · Report an issue` (report link = existing profile_reports flow).
**Step 5:** `npm run build` → green. Commit: `git commit -m "feat: privacy policy, terms, data-source notice + removal path on profiles"`.

### Task 9: Stress-test readiness + ship

**Step 1:** Full gate: `npx vitest run` (all, including both static guards) + `npm run build` → green.
**Step 2:** Supabase `get_advisors` (security + performance) — nothing new beyond the accepted 15 INFO + 2 WARN.
**Step 3:** Quiz persistence + rankings recompute spot-check (admin button on /admin/rankings) per stress-test plan.
**Step 4:** Push to `origin/main`, watch the Vercel deploy to Ready, then verify live: both sister profiles, one blog post footer, /privacy, /terms, /evaluate labels.
**Step 5:** Commit any doc updates; update `CLAUDE.md` (Task 10).

### Task 10: Documentation + memory hygiene (kill the stale resume prompts)

**Files:**
- Modify: `CLAUDE.md` (replace the stale "execute Phase A" kickoff prompt with: *"Read CLAUDE.md and docs/plans/2026-07-10-phase-2-trust-data-and-legal.md; check the plan's task list against git log before executing anything."*; move completed items out of Open Items)
- Modify: memory `project_next_steps.md` (mark Phase 2 executed, list remaining owner actions)

Commit: `git commit -m "docs: CLAUDE.md refresh — stale kickoff prompt replaced, open items current"`.

---

## Deferred / owner-gated (do NOT build)

- **Spotify Show ID** — owner must get the real ID (current one 404s).
- **Unit-preference toggle (kg/cm first)** — Phase 3, after all the above.
- **"Network → Talkin Balls Network" rename** — held until Neil agreement settles (hold date was 6/15; confirm with Daniel).
- **Paid services tab** — on hold per Daniel's earlier answer.
- **Stripe/merch go-live** — blocked on US business formation; see legal review (do NOT take payments before an entity exists).
