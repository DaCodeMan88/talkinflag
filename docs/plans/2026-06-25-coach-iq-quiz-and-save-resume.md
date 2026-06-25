# Plan — Coach IQ Quiz (with real purpose) + Universal Save-&-Resume

**Status:** PLANNED (not started). Authored 2026-06-25.
**Branch (when built):** `coach-iq-quiz`
**Owner direction:**
- Build a **Coach IQ quiz** whose purpose is to *establish coaching credibility and feed the coach poll weight* — not trivia.
- Build off the existing general quiz: keep it as reference, **swap a handful of questions, add more** coach-specific ones.
- **A+++ UI/UX.**
- **Cross-cutting:** all quizzes *and* general profile setup must let the user **save progress and come back later**.
- **Out of scope (owner):** Expert and Player quiz variants (not planned), eval "production" prose review, password protection / login CAPTCHA (deferred).

---

## What already exists (so we build, not rebuild)

- **IQ infra is category-aware already.** `iq_quizzes.category` allows `'host' | 'coach' | 'expert' | 'player' | 'general'` (migration 003). `iq_questions` (answer key server-only, RLS no-policy), `iq_attempts`, and the `iq_best` view (`DISTINCT ON (user_id, category)`) all key by category. So a coach quiz is a **new seeded quiz row + questions**, plus a route — no schema change for the quiz itself.
- **Scoring** is pure: `src/lib/iq/score.ts` `scoreAttempt()`. Submit route `/api/iq/submit` writes attempts via service role.
- **Runner UI:** `src/components/iq/IQQuizRunner.tsx` (local `useState` for `index`/`answers`, keyboard nav, results) — **no persistence today.**
- **Eligibility:** `src/lib/eval/eligibility.ts` → coach = verified `coaches` row.
- **Coach poll weight today = EQUAL.** `src/lib/eval/aggregate.ts` `aggregateRoleWeights()` is a plain element-wise **mean** of each coach's eval fingerprint — every coach counts the same. `tfRank` blends roles at a fixed 55/30/15 (`blend.*`). **There is no per-coach weighting yet.** Delivering the quiz's "purpose" = introducing per-coach credibility weighting (master-plan Phase C, coach slice).
- **Career updates (Phase F, shipped)** already capture championships/postseason/awards per user → a natural input to coach credibility.
- **Profile setup** (`src/app/dashboard/edit/EditProfileForm.tsx`) and the **eval runner**, **career-update form**, and **claim flow** are all local-state forms with no draft save.

---

## Decisions (made on owner's "do what you think is best")

1. **Coach quiz is open to take by anyone**, but the score only contributes to **poll weight for verified coaches**. (Non-coaches still get an IQ number + learning value → funnel toward applying as a coach.)
2. **Length ~32 questions** — reference the 40 general Qs: keep ~10 universal, swap ~5 weak ones, add ~22 coach-specific. (Final count tunable.)
3. **Save/resume = hybrid:** instant `localStorage` autosave + debounced server draft (cross-device). One generic `form_drafts` table covers quizzes, profile setup, eval, and career updates.
4. **Per-coach weighting introduced now for the coach role only.** Expert/host stay equal-weight until their own pass (keeps blast radius small; matches "Expert/Player fine").
5. Weekly recompute (already wired) picks up new coach weights automatically once `CRON_SECRET` is set; admin can also recompute manually.

---

## Phase 1 — Coach IQ quiz content + seed

**Goal:** a credible, coach-grade question bank.

- **Question domains** (coach-specific, beyond general rules/strategy):
  - Practice design & periodization; install scripting
  - In-game adjustments, play-calling sequencing, tempo
  - Clock & timeout management; end-of-half / 2-minute logic
  - Down-and-distance & field-zone decision-making (4-down, red zone, backed-up)
  - Defensive scheme: coverage families (man/zone/match), rush/blitz rules legal in 5v5 & 7v7, disguise
  - Offensive scheme: route concepts vs coverage, motion/leverage, protection of the rusher count
  - Player evaluation & development (ties to the Evaluation taxonomy)
  - Rules/officiating edge cases a coach must know; protest/appeal situations
  - Leadership, culture, communication, safety
- **Sourcing:** reuse the Talkin Flag NotebookLM (`e70d736e-…`, rulebooks/coverages/route-trees) used for the general quiz. **No invented facts** — answer key must be defensible.
- **Difficulty tiers** stored on each question (reuse `iq_questions` fields; add a `tier`/`domain` to `detail` if present, else `stats`-style note) for later analytics. Verify exact `iq_questions` columns before seeding.
- **Seed script** `scripts/seed-iq-coach.ts` mirroring `scripts/seed-iq.ts`: insert quiz `category='coach'`, version 1, ~32 questions; idempotent (upsert on `(quiz_id, ordinal)`); answer key server-only.
- **Commit:** `feat(iq): seed Coach IQ quiz (category=coach)`.

## Phase 2 — Coach credibility weight (the purpose)

**Goal:** credible coaches' votes count more; Coach IQ is the primary lever.

- **Pure function** `src/lib/eval/coachWeight.ts` → `coachCredibilityWeight(input): number` (e.g. 0.5–2.0 multiplier), TDD. Inputs, normalized & capped:
  - Coach IQ `score_pct` (primary weight)
  - `level` (national > college > HS) 
  - win% = `wins / (wins + losses)` (guard divide-by-zero, require min games)
  - `years_coaching` (experience, diminishing returns)
  - postseason/championship/title_game counts from **approved `career_updates`**
  - Require a **minimum Coach IQ threshold** to carry *any* extra weight (gate against low-effort coaches inflating influence).
- **Aggregation change:** in `src/lib/eval/aggregate.ts`, add `aggregateRoleWeightsWeighted(entries: {fingerprint, weight}[])` (weighted mean). Keep the existing plain `aggregateRoleWeights` for expert/host.
- **Recompute wiring:** `src/lib/rankings/recompute.ts` `recomputeEvalWeights()` — for the coach role, join each `eval_responses` row to its coach's credibility weight (IQ + coaches row + career_updates) and use the weighted aggregate. Expert/host unchanged.
- **Surfacing:** show Coach IQ + a plain-language "voting influence" indicator on the coach profile and in `/admin/coaches`; explain on `/how-rankings-work`.
- **Tests:** `coachWeight` edge cases (no games, no IQ, capping, threshold), weighted-mean aggregation.
- **Commit:** `feat(rank): coach credibility weighting from Coach IQ + record`.

## Phase 3 — Universal save-&-resume

**Goal:** never lose quiz or profile progress; resume on any device.

- **Migration `008_form_drafts.sql`:** `form_drafts (id, user_id, kind text, ref text, data jsonb, updated_at, UNIQUE(user_id, kind, ref))`. `kind` ∈ `quiz:coach | quiz:general | profile | eval | career_update`. RLS enabled, **no policy** (service-role only, matching app posture). Apply via MCP + commit file.
- **API** `src/app/api/drafts/route.ts`: `GET ?kind&ref` (load), `PUT` (upsert draft), `DELETE` (clear on completion). Auth required; service-role write; small payload caps.
- **Client hook** `src/hooks/useAutosaveDraft.ts`:
  - On mount: hydrate from `localStorage` immediately, then reconcile with the server draft (newest `updated_at` wins) → show a "Resume where you left off?" banner.
  - On change: write `localStorage` instantly + **debounced** (~1.5s) server `PUT`; show a subtle "Saved ✓" indicator.
  - On submit/complete: `DELETE` the draft + clear localStorage.
- **Wire into:** `IQQuizRunner` (answers + index, keyed `quiz:<category>`), `EditProfileForm` (`profile`), eval runner (`eval`), career-update form (`career_update`), and the claim/profile-setup step.
- **Commits:** `feat(drafts): form_drafts table + autosave API + useAutosaveDraft`, then `feat(ux): wire save-&-resume into quizzes + profile setup`.

## Phase 4 — A+++ UI/UX

**Goal:** the quiz and profile flows feel premium.

- Quiz: animated progress bar + "Q n of N", smooth per-question transition, keyboard 1–5 + arrows (extend existing), autosave indicator, resume banner, polished results screen (Coach IQ grade + "what this unlocks: voting influence" explainer + retake + share).
- Profile setup: step/section affordance, inline validation, autosave indicator, resume banner.
- Mobile-first; brand system (Anton display / Inter body, `#FDDD58` on black, uppercase tracked headings); reduced-motion + focus management + aria for accessibility.
- **Commit:** `feat(ux): A+++ quiz + profile experience`.

---

## Migrations & artifacts
- `supabase/migrations/008_form_drafts.sql` (apply via MCP, commit file)
- `scripts/seed-iq-coach.ts` (+ coach question data)
- New libs: `src/lib/eval/coachWeight.ts`, `src/hooks/useAutosaveDraft.ts`
- New API: `/api/drafts`, route `/iq/coach`

## Verification
- `npx vitest run` (new pure-fn tests), `npm run build`, anon smoke (coach quiz loads, answer-key not exposed), draft round-trip (start → leave → resume → submit → draft cleared), recompute reflects coach weighting.

## Dependencies / notes
- Coach weighting reads `career_updates` (Phase F, shipped) and `iq_best` (coach category).
- Auto weekly recompute needs `CRON_SECRET` (owner to-do); manual recompute works regardless.
- Confirm exact `iq_questions` columns before seeding (tier/domain placement).
- Keep answer keys server-only (RLS no-policy + service-role), consistent with existing IQ/eval posture.
