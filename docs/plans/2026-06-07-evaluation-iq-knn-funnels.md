# Talkin Flag — Evaluation Funnels (100-Pt Philosophy + Flag IQ) + KNN Similarity — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Work in `/Users/danielharris/Desktop/Flag/talkinflag/`. Branch off `main`. Commit after every task. `npx tsc --noEmit` and `npm run build` must pass before pushing. Supabase project `wxeuybksowhncalrnttl`. **No invented content** — quiz questions come from owner / the "Talkin Flag: Global Insights from the Gridiron" NotebookLM, never fabricated.

**Goal:** Ship the two member-facing quiz funnels and the data science layer behind Talkin Flag's ranking system: (1) a fast, interactive **100-question Athlete Evaluation Philosophy** questionnaire (10 sections × 10) that produces each member's "evaluation fingerprint" and, aggregated per constituency, *becomes* the Host / Coach / Expert poll rubric weights — the "100-point algorithm"; (2) a separate **Flag Football IQ** knowledge quiz sourced from the NotebookLM; and (3) a **KNN player-similarity engine** in Postgres (pgvector) that normalizes performance by league difficulty so an elite player's profile retrieves stylistically identical "hidden gems" across leagues.

**Architecture:** Next.js 16 App Router + TypeScript + Tailwind + Supabase (Postgres/RLS/Auth) + pgvector + Vitest. All evaluation/scoring/aggregation/normalization/KNN math lives in **pure, TDD'd functions** under `src/lib/`. The questionnaire scores each respondent into a 10-dimension, 100-point vector ("fingerprint"); fingerprints aggregate per role into `ranking_weights` rows that the TF rank engine already consumes (master-plan Phase D). The same 10-dimension, league-adjusted player profile vector powers both ranking and KNN similarity via a pgvector index.

**Tech Stack:** Next.js 16, React 19 Server Components, Supabase JS v2, Postgres RLS + pgvector (`vector` 0.8.0, HNSW), Vitest, Tailwind brand tokens (`brand-yellow #FDDD58`, `font-display` Anton).

---

## ✅ BUILD STATUS (updated 2026-06-07 — shipped to production, main)

| Phase | What | Status |
|---|---|---|
| 0 | Foundations (drop backups, Vitest, pgvector) | ✅ Done |
| 1 | **Evaluation Philosophy funnel** `/evaluate` — 100 items, server-scored, archetype + radar + science rollup + elite-ideal gap; aggregates → `ranking_weights` | ✅ **LIVE** |
| 2 | **Flag IQ funnel** `/iq` + `/iq/general` — 40 evergreen Qs (incl. 7v7), server-scored, explanations | ✅ **LIVE** |
| 3 | **KNN player similarity** — pgvector HNSW, league-adjusted 10-dim vector, `similar_players()` RPC, "Statistical DNA" on `/players/[id]` | ✅ **LIVE** |
| — | Role eligibility from existing systems (admin email=host, verified coach, approved scout) — no new admin UI | ✅ Done |
| — | Dashboard `MemberInsightsCard` (archetype + IQ + CTAs) | ✅ Done |
| 4 | **TF Rank integration** — consume `ranking_weights` + league-adjusted dims into `players.ranking_national`/`ranking_position`; admin recompute + snapshot; rewrite `/how-rankings-work` + `/rankings` breakdown | ✅ **LIVE** (commit `47473cb`, main) |

**Tests:** 34 vitest passing (`npm test`). **Seeds:** `npx tsx scripts/seed-eval.ts`, `scripts/seed-iq.ts`, `scripts/build-player-vectors.ts`. **Migrations on disk:** `supabase/migrations/002_evaluation_funnel.sql`, `003_flag_iq_funnel.sql`, `004_knn_player_similarity.sql`, `005_ranking_snapshots.sql` (all applied live).

**Owner enablement:** set `ADMIN_EMAILS` (+ `ADMIN_EMAIL`) in Vercel to Ambra's & Tika's login emails → they auto-count as Hosts and gain admin pages. Eval prose (esp. `production` section) is owner-editable in `scripts/data/eval-items.json` then re-seed.

**ALL PHASES COMPLETE.** To activate: go to `/admin/rankings` → click "Recompute Rankings Now" to run the first compute pass and populate player ranks.

---

## How this fits the existing master plan

This plan **implements and sharpens** Phases B/C/D of `docs/plans/2026-06-06-community-rankings-platform.md`, and **adds** the KNN feature that plan did not cover. Two design decisions from the new owner brief override/refine the master plan:

1. **The "100-pt rubric" is data-driven, not admin-typed.** The master plan had admins hand-enter `ranking_weights`. Instead, the **Evaluation Philosophy questionnaire** measures how each member judges athletes; aggregated per constituency it *produces* those weights. Admins can still override, but the default source of truth is the membership's collective opinion. This is the literal "100-point algorithm to rank the players."
2. **One shared questionnaire; the member's chosen role routes their influence.** Host (currently only Ambra + Tika), Coach, and Expert all answer the same 100 questions; a member's role determines **which poll's aggregate fingerprint** their answers feed. Players may take it for self-insight but carry **no poll power** (same rule as the master plan's Player IQ).

Where this plan and the master plan touch the same tables (`member_roles`, `iq_*`, `ranking_weights`), this plan's migrations are the canonical ones — the master-plan Phase B/C SQL was illustrative.

---

## Reconciliation with CLAUDE.md & live DB state (don't drop these)

Pulled from `CLAUDE.md`, `project_talkinflag` memory, and `project_next_steps` memory so nothing already-known is missed:

- **Unverified players are the majority.** DB has **374 players: 41 HS · 206 college · 127 national**, of which **284 are flagsonly imports tagged `stats.source='flagsonly'`, `is_verified=false`, `is_claimed=false`**. KNN/ranking must **not silently exclude 76% of the DB**. Build `profile_vector` for *all* players from whatever stats exist, but carry a **confidence flag** (`is_verified`) so unverified players are shown as "unverified DNA match" and weighted lower in TF rank. (See Phase 3.2 / 4.1 edits below.)
- **League keys come from existing tagging.** Map `players.level` + `stats.team_designation` (`national_senior`/`national_junior`/`national_youth`/`olympic_2028`) + `country_code` → `league_key`. This mapping is the 🔢 owner item in Phase 3.1; the source columns already exist.
- **Position constraint.** `players.position` check constraint = `QB | WR | DB | LB | C | Rusher | Utility`. `ranking_position` in Phase 4.1 buckets within these exact values.
- **Admin gating + env vars.** Admin routes (`/api/admin/eval/recompute-weights`, `/api/admin/knn/rebuild`, `/api/admin/recompute-rankings`, `/admin/rankings`) must reuse the existing admin-gate pattern. ⚠️ The codebase uses **both** `ADMIN_EMAIL` (singular — admin home/results) **and** `ADMIN_EMAILS` (plural — scouts/events). New admin surfaces should check the same helper; set **both** env vars in Vercel or some admin pages won't authorize.
- **Supabase clients.** Server routes/pages use `src/lib/supabase/server.ts`; client/anon reads use `src/lib/supabase/index.ts`. All answer-key scoring uses the **server** client (service role where needed) — never the anon client.
- **Nav/Footer/sitemap wiring.** Nav is intentionally trimmed to **6 links** (Players · Teams · Podcast · Events · Blog · About) — `src/components/layout/Nav.tsx`. Don't bloat it. Surface `/evaluate` and `/iq` via the **member dashboard** (`src/app/dashboard/`) + the **claim funnel**, and add a Footer entry (`src/components/layout/Footer.tsx`) under the existing "Compete"/Platform column. Add new **public** surfaces to `src/app/sitemap.ts` (`/evaluate`, `/iq`, rankings); keep mid-flow/answer pages `noindex`.
- **Claim-outreach is the top of this funnel.** The 284 flagsonly athletes → claim profile → take Player IQ → get verified is the intended entry (master-plan H5). It needs `RESEND_API_KEY` (Vercel). The funnel pages work without it; the *outreach email* is gated on that key — note as an owner action, don't block.
- **Existing rubric is still deferred, by design.** CLAUDE.md lists "TF Rankings Algorithm — Deferred, needs 100-pt rubric from Ambra & Tika." **This plan is that rubric** — but sourced from the membership's questionnaire aggregates (with admin override), not a hand-typed table.

---

## The "100-Point Algorithm" — design spec (read before coding)

**Grounded in the NotebookLM taxonomy.** The structure below is the **Hybrid model** (owner-confirmed 2026-06-07): the member answers **10 practical, flag-football-native sections** (fast and intuitive to judge), but every item is grounded in and **cites a specific trait** from the notebook's *"Biopsychosocial Architecture of Elite Athletic Performance"* (100 traits) and its tier ranking. Each member's fingerprint therefore rolls up **two ways**: (a) the 10 practical buckets (used for ranking + KNN), and (b) the **6 science dimensions** from the taxonomy (used for the credibility/"gap vs elite" summary). Source notes: `efef5d55…` (Architecture/100 traits), `ec49eeb7…` (1–100 tier ranking), both in notebook `e70d736e-e7f2-4360-97b6-0948f10e16c9`.

**The 6 science dimensions (from the taxonomy):** `S1` Cognitive Processing & Tactical Game Intelligence · `S2` Visual Search, Gaze Control & Visuomotor Integration · `S3` Psychological Characteristics of Developing Excellence & Coping · `S4` Personality, "Mamba Mentality" & Behavioral Traits · `S5` Neuromuscular, Contractile & Proprioceptive Adaptations · `S6` Physiological, Anthropometric & Autonomic Recovery. The taxonomy's thesis (encode it in the summary copy): **at the elite level psychological/cognitive traits (Tiers 1–2) outrank physical ones (Tiers 5–6).**

**10 practical sections, 10 points each = 100.** Each questionnaire **section** maps to one practical dimension and contains **10 multiple-choice items**. Answers yield a **0–10 importance score** per dimension → the member's **fingerprint** (a 10-vector ~summing to 100 after normalization). Each section also maps to the science dimension(s) it draws from, so the same answers roll up to the 6 `S` dimensions.

| # | Dimension key | Name | What it captures | Science map |
|---|---|---|---|---|
| 1 | `athleticism` | Athleticism & Explosiveness | speed, acceleration, change-of-direction, vertical | S5 |
| 2 | `football_iq` | Football IQ & Decision-Making | reads, anticipation, situational awareness | S1 |
| 3 | `ball_skills` | Ball Skills & Visuomotor | catching/hands; QB accuracy & touch; tracking | S2 |
| 4 | `defense` | Flag-Pulling & Defensive Technique | pursuit angles, deflag rate, coverage, inhibitory control | S1+S2+S5 |
| 5 | `production` | Raw Production | TDs, completions, INTs, sacks — output | (objective; weak S-map) |
| 6 | `competition` | Competition Level | strength of schedule / who they did it against | (league-adjust; see Phase 3) |
| 7 | `clutch` | Clutch & Big-Game | coping under pressure, postseason, late-game | S3 |
| 8 | `versatility` | Versatility | multi-position, cognitive flexibility, two-way play | S1 |
| 9 | `intangibles` | Intangibles & Leadership | coachability, mental toughness, captaincy, Mamba mentality | S3+S4 |
| 10 | `consistency` | Consistency & Durability | year-over-year, availability, recovery, sleep/HRV | S6 |

**Item format (fast & intuitive):** single-select, **5 options**, auto-advance on tap, keyboard `1–5`. Two item styles, mixed within a section:
- **Importance** ("How much does a defender's *deflag rate* change your evaluation?" → Not at all → Decisive) — option index 0–4 maps to weight `0,1,2,3,4`.
- **Forced trade-off** ("The more valuable player:" → a stats monster on a weak schedule vs. a steady producer in a title game) — the chosen option contributes to whichever dimension it represents (an item may award points to a *different* dimension than its host section; encoded per-option, see `dimension` on each option).

So scoring is **option → (dimension, points)**, not section-locked. This lets trade-off items pit dimensions against each other while still rolling up to the 10 totals. Per-section normalization keeps each dimension in 0–10.

**The summary breakdown ("your perspective"):** after submit, the member sees:
1. A **radar chart** of their 10 practical dimensions + top-3 / bottom-2 in plain language.
2. An **archetype** label from their fingerprint (e.g. *Film-Room Evaluator*, *Numbers Purist*, *Big-Stage Believer*, *Athlete-First Scout*, *Old-School Fundamentalist*) — nearest centroid, pure function, TDD'd.
3. A **6-dimension science rollup** (S1–S6) showing where they sit on the biopsychosocial map.
4. **The gap vs the elite ideal** (owner-confirmed): compare their weighting to the taxonomy's tier-derived reference vector and surface it in one line, e.g. *"You weight physical traits (S5/S6) higher than elite-performance research suggests — champions are separated more by coping (S3) and game IQ (S1)."* The reference vector is a fixed, citation-backed constant derived from the 1–100 tier ranking (Tier 1 traits weighted highest → Tier 6 lowest), rolled up to the same 10 buckets + 6 S-dimensions.

**How fingerprints become the rubric:** for each role (`host`/`coach`/`expert`), average all members' fingerprints → 10 weights → upsert as `ranking_weights` rows keyed `dim.<role>.<dimension>` (e.g. `dim.coach.football_iq`). The TF rank engine (master-plan Phase D) scores each player on the same 10 dimensions (from verified stats, league-adjusted — see Phase 3) and blends by these weights, then blends the three role-polls Coaches > Experts > Hosts. (The reference vector is **not** a rubric — it's only the benchmark shown in the summary; the live rubric is always the membership's actual aggregated opinion, admin-overridable.)

### Decisions (confirmed 2026-06-07; recorded in `docs/plans/decisions-evaluation.md`)
- **D1. Structure = Hybrid ✅** — 10 practical sections, each item grounded in & citing a taxonomy trait; fingerprint rolls up to 10 buckets **and** 6 science dimensions.
- **D2.** Same 100 questions for all roles; role only routes influence. Default = yes (confirm).
- **D3.** Archetype set + centroids (5 archetypes above). Default = use them; owner may rename.
- **D4.** The 100 item texts/options → drafted **from the NotebookLM** (`e70d736e…`), trait-cited, then Ambra & Tika approve. Build ships a clearly-marked placeholder bank so the flow is testable end-to-end before sign-off.
- **D5.** Cross-role blend Coaches > Experts > Hosts default split **55 / 30 / 15** (confirm).
- **D6. Summary shows the elite-ideal gap ✅** — compare member weighting to the taxonomy's tier-derived reference vector.

---

## PHASE 0 — Foundations (test runner, cleanup, pgvector)

**Branch:** `eval-iq-knn-foundations`

### Task 0.1: Drop leftover backup tables (must precede new migrations)

**Step 1:** Via Supabase MCP `execute_sql` on project `wxeuybksowhncalrnttl`:
```sql
DROP TABLE IF EXISTS _backup_players_20260606;
DROP TABLE IF EXISTS _backup_events_20260606;
```
**Step 2: Verify** MCP `list_tables` no longer shows them.
**Step 3: Commit** (no code change — note in PR description; nothing to commit unless you add a migration record). If you want it on disk, create `supabase/migrations/002_drop_backups.sql` with the two `DROP`s and commit: `chore(db): drop 20260606 backup tables (migration 002)`.

### Task 0.2: Add Vitest

**Files:** Modify `package.json`; Create `vitest.config.ts`.

**Step 1:** Install: `npm i -D vitest @vitejs/plugin-react`
**Step 2:** Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
```
**Step 3:** Add scripts to `package.json`: `"test": "vitest run"`, `"test:watch": "vitest"`.
**Step 4:** Create a smoke test `src/lib/__smoke__.test.ts` with `test("vitest runs", () => expect(1).toBe(1))`.
**Step 5: Run** `npm test` → 1 passed. Delete the smoke test.
**Step 6: Commit** `chore(test): add Vitest runner + config`.

### Task 0.3: Enable pgvector

**Files:** Create `supabase/migrations/003_enable_pgvector.sql`; apply via MCP `apply_migration`.
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```
**Verify:** MCP `list_extensions` shows `vector` with a non-null `installed_version`.
**Commit:** `feat(db): enable pgvector extension (migration 003)`.

---

## PHASE 1 — Athlete Evaluation Philosophy questionnaire (the 100-pt algorithm)

**Branch:** `eval-philosophy-funnel`
**Depends on:** Phase 0. **Reuses:** Supabase auth.

### Task 1.1: Schema — roles, questionnaire, items, responses, fingerprints

**Files:** `supabase/migrations/004_evaluation.sql`; apply via MCP.
```sql
-- member role (a user may hold several; one questionnaire, role routes influence)
CREATE TABLE IF NOT EXISTS member_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('host','coach','expert','player')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- the 10 dimensions, as reference data
CREATE TABLE IF NOT EXISTS eval_dimensions (
  key TEXT PRIMARY KEY,                 -- 'athleticism', 'football_iq', ...
  ordinal INTEGER NOT NULL,             -- 1..10 (section order)
  name TEXT NOT NULL,
  description TEXT
);

-- versioned questionnaire (one active version; 100 items across 10 sections)
CREATE TABLE IF NOT EXISTS eval_questionnaires (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (version)
);

CREATE TABLE IF NOT EXISTS eval_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  questionnaire_id UUID NOT NULL REFERENCES eval_questionnaires(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL REFERENCES eval_dimensions(key),  -- host section/dimension (1 of 10)
  ordinal INTEGER NOT NULL,             -- 1..100 global order
  prompt TEXT NOT NULL,
  -- options: [{label, dimension, points}] — option awards `points` to `dimension`
  options JSONB NOT NULL,
  style TEXT NOT NULL DEFAULT 'importance' CHECK (style IN ('importance','tradeoff')),
  science_dimension TEXT,               -- 'S1'..'S6' from the taxonomy (rollup)
  taxonomy_trait_id INTEGER,            -- 1..100, the cited trait
  taxonomy_tier INTEGER,                -- 1..6 importance tier of that trait
  source_citation TEXT                  -- e.g. 'efef5d55… trait 16 (Coachability)'
);

-- the taxonomy's tier-derived "elite ideal" reference vector (for the summary gap),
-- one row per practical dimension and per science dimension; not a live rubric.
CREATE TABLE IF NOT EXISTS eval_reference (
  key TEXT PRIMARY KEY,                 -- 'dim.football_iq' | 'sci.S1' ...
  value NUMERIC(6,3) NOT NULL,          -- 0..10 ideal importance
  description TEXT
);

-- one row per completed questionnaire run
CREATE TABLE IF NOT EXISTS eval_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  questionnaire_id UUID NOT NULL REFERENCES eval_questionnaires(id),
  role_at_submit TEXT NOT NULL CHECK (role_at_submit IN ('host','coach','expert','player')),
  answers JSONB NOT NULL,               -- [{item_id, chosen_index}]
  fingerprint JSONB NOT NULL,           -- {athleticism:0-10, ...} the 100-pt vector
  archetype TEXT NOT NULL,
  taken_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_eval_responses_user ON eval_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_eval_responses_role ON eval_responses(role_at_submit);

-- admin-editable / aggregate-written rubric weights (shared with TF rank engine)
CREATE TABLE IF NOT EXISTS ranking_weights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,             -- e.g. 'dim.coach.football_iq', 'poll.coaches'
  value NUMERIC(8,3) NOT NULL,
  description TEXT,
  source TEXT NOT NULL DEFAULT 'aggregate' CHECK (source IN ('aggregate','admin')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
Add RLS: `member_roles`/`eval_responses` owner-insert + owner-read; `eval_dimensions`/`eval_questionnaires`/`eval_items` public read **but `eval_items.options` must not leak point mappings pre-submit** — serve items to the client through a server route that strips `dimension`/`points` from each option (keep only `label`). `ranking_weights` public read, admin/service write. Aggregate fingerprints are public read by design (transparency — "coaches see how much their opinion weighs").

**Verify:** MCP `list_tables` shows the new tables. **Commit:** `feat(db): evaluation questionnaire + fingerprint + ranking_weights schema (migration 004)`.

### Task 1.2: Seed the 10 dimensions + science map + elite-ideal reference + questionnaire shell

**Files:** `scripts/seed-eval-dimensions.ts` (upsert the 10 `eval_dimensions` rows — include the `S`-map in `description`), one active `eval_questionnaires` row (version 1), and `scripts/data/eval-reference.json` + seed of `eval_reference`.
- **Build the reference vector from the taxonomy tiers** (cite `ec49eeb7…`): assign each of the 100 traits a tier weight (Tier 1 → highest … Tier 6 → lowest), roll the traits up into the 10 practical buckets and the 6 `S` dimensions via the same `taxonomy_trait_id → dimension` mapping used by the items, normalize each to 0–10, and store as `eval_reference` rows `dim.*` and `sci.*`. This is a fixed, citation-backed constant (the "elite ideal" for the D6 gap), **not** a live rubric.
**Verify:** `select count(*) from eval_dimensions` → 10; `eval_reference` has 16 rows (10 `dim.*` + 6 `sci.*`). **Commit:** `feat(eval): seed dimensions + science map + taxonomy-derived elite-ideal reference vector`.

### Task 1.3 (TDD): `scoreFingerprint` pure function

**Files:** Create `src/lib/eval/score.ts` + `src/lib/eval/score.test.ts`.

**Step 1 — failing test:**
```ts
import { test, expect } from "vitest";
import { scoreFingerprint } from "./score";

const items = [
  { id: "a", options: [
    { label: "Not at all", dimension: "defense", points: 0 },
    { label: "Decisive",   dimension: "defense", points: 4 },
  ]},
  { id: "b", options: [   // tradeoff: option routes to a different dimension
    { label: "Stats monster", dimension: "production", points: 4 },
    { label: "Title-game steady", dimension: "clutch", points: 4 },
  ]},
];

test("scoreFingerprint sums option points per dimension", () => {
  const fp = scoreFingerprint(items, { a: 1, b: 1 }); // a→defense 4, b→clutch 4
  expect(fp.defense).toBe(4);
  expect(fp.clutch).toBe(4);
  expect(fp.production).toBe(0);
});
```
**Step 2: Run** `npm test src/lib/eval/score.test.ts` → FAIL (not defined).
**Step 3: Implement** `scoreFingerprint(items, answers)`: init all 10 dimension keys to 0; for each answered item, read the chosen option's `{dimension, points}`, add. Return the raw 10-vector.
**Step 4: Run** → PASS.
**Step 5: Commit** `feat(eval): scoreFingerprint pure function + tests`.

### Task 1.4 (TDD): `normalizeFingerprint` to a 100-point vector

**Files:** same `score.ts`, extend test file.

**Step 1 — failing test:** given a raw vector, `normalizeFingerprint` scales each dimension to 0–10 by its **max possible points in that dimension** (passed in as `maxPerDimension`), so every fingerprint is comparable and the 10 values land in 0–10.
```ts
test("normalizeFingerprint scales each dimension to 0-10", () => {
  const raw = { defense: 4, clutch: 8, /* ...others 0 */ } as any;
  const max = { defense: 8, clutch: 8 } as any;
  const n = normalizeFingerprint(raw, max);
  expect(n.defense).toBe(5);   // 4/8*10
  expect(n.clutch).toBe(10);
});
```
**Step 2–4:** fail → implement (guard divide-by-zero → 0) → pass.
**Step 5: Commit** `feat(eval): normalizeFingerprint (0-10 per dimension) + tests`.

### Task 1.5 (TDD): `classifyArchetype` + `scienceRollup` + `idealGap` pure functions

**Files:** Create `src/lib/eval/archetype.ts`, `src/lib/eval/science.ts`, `src/lib/eval/vector.ts` (shared `euclidean`) + tests.
- `classifyArchetype(fingerprint)` → nearest of 5 centroids (D3) by Euclidean distance.
- `scienceRollup(fingerprint, sciMap)` → the 6 `S` dimension scores by averaging the practical dims that map to each `S` (sciMap from `eval_dimensions`).
- `idealGap(memberVector, referenceVector)` → per-dimension signed delta + the single largest over/under-weighted dimension, for the D6 summary line.

**Step 1 — failing tests:** (a) fingerprint maxed on `football_iq`+`defense` → `Film-Room Evaluator`; maxed on `production` → `Numbers Purist`. (b) `scienceRollup` maps `athleticism`→`S5`, `football_iq`→`S1`. (c) `idealGap` flags a physical-heavy fingerprint as "over-weights S5/S6 vs ideal."
**Step 2–4:** fail → implement → pass.
**Step 5: Commit** `feat(eval): archetype + science rollup + elite-ideal gap functions + tests`.

### Task 1.6: Server submit route

**Files:** Create `src/app/api/eval/submit/route.ts`.
- Auth required. Body = `{ answers: {item_id: chosen_index}, role }` (role validated against the user's approved `member_roles`; players allowed but flagged no-power).
- Server-side: load active questionnaire items **with** point mappings, run `scoreFingerprint` → `normalizeFingerprint` → `classifyArchetype`, insert `eval_responses`, and (Task 1.9) trigger role aggregate refresh.
- Return `{ fingerprint, archetype, dimensionMeta }` for the summary screen. Never trust client-computed scores.

**Verify:** `npm run build`. **Commit:** `feat(eval): server-scored questionnaire submit route`.

### Task 1.7: Items fetch route (answer-stripped)

**Files:** Create `src/app/api/eval/items/route.ts` — returns active questionnaire items as `{ id, section_key, ordinal, prompt, style, options: [{label}] }` (strip `dimension`/`points`). Group by section for the UI.
**Verify:** `npm run build`; confirm response JSON has no `points`. **Commit:** `feat(eval): answer-stripped items fetch route`.

### Task 1.8: Questionnaire UI — fast, interactive runner

**Files:** Create `src/app/evaluate/page.tsx` (server: gate to logged-in; fetch items via 1.7) and `src/components/eval/EvaluationRunner.tsx` (client).

UX spec (elite, branded):
- One item on screen at a time; **section progress** ("Section 3/10 · Defense") + a thin global 0–100 progress bar in `brand-yellow`.
- 5 large tap targets; **auto-advance** ~150ms after select; keyboard `1–5`; `←` to go back. Framer-free (project removed GSAP) — use CSS transitions + `IntersectionObserver` patterns already in the codebase.
- Between sections show a 1-line interstitial ("On to **Ball Skills** →") for pace/rhythm.
- Section headers use `font-display uppercase tracking-widest`; black/yellow/white only.
- On the 100th answer, POST to `/api/eval/submit`, then route to the summary (Task 1.9 component) with the returned fingerprint.

**Verify:** `npm run build`; manual: complete a placeholder run, land on summary. **Commit:** `feat(eval): interactive 100-question runner (auto-advance, keyboard, sectioned)`.

### Task 1.9: Summary "your perspective" screen

**Files:** Create `src/components/eval/PerspectiveSummary.tsx`. Render:
- A **radar/spider chart** of the 10 practical dimensions (build a dependency-free inline SVG radar `src/components/eval/RadarChart.tsx` — no chart lib; ~80 lines of SVG polar math). Overlay the **elite-ideal reference vector** as a faint second ring so the gap is visible.
- Archetype headline + one-paragraph description; top-3 / bottom-2 dimensions in plain language.
- A **6-dimension science rollup** (S1–S6) via `scienceRollup`, with short labels.
- The **D6 "gap vs elite ideal" line** via `idealGap` (e.g. "You weight physical traits higher than elite-performance research suggests — champions are separated more by coping & game IQ"), with a one-line citation to the taxonomy.
- A "this shapes the **{Role} Poll**" note (or, for players, "for your insight only — players don't carry poll weight").
- Share/retake buttons; retake routes back to `/evaluate`.

**Verify:** `npm run build`; visual check via preview. **Commit:** `feat(eval): perspective summary (radar + science rollup + elite-ideal gap)`.

### Task 1.10 (TDD): `aggregateRoleWeights` + write-through

**Files:** Create `src/lib/eval/aggregate.ts` + test, and `src/app/api/admin/eval/recompute-weights/route.ts`.

**Step 1 — failing test:** `aggregateRoleWeights(fingerprints)` = element-wise mean over a role's fingerprints → 10 weights; with two fingerprints it returns their average per dimension.
**Step 2–4:** fail → implement → pass.
**Then:** the admin route (admin-gated) pulls latest `eval_responses` per user per role, averages via `aggregateRoleWeights`, and upserts `ranking_weights` rows `dim.<role>.<dimension>` with `source='aggregate'`. The submit route (1.6) calls this for the submitter's role (or marks weights stale for an admin to recompute — pick incremental recompute to keep it live).
**Step 5: Commit** `feat(eval): aggregate role fingerprints into ranking_weights + admin recompute`.

### Task 1.11: Author the 100 questions from the NotebookLM taxonomy 🔢

**Files:** `scripts/data/eval-items.json` + `scripts/seed-eval-items.ts` (upsert 100 items into `eval_items`, populating `science_dimension`, `taxonomy_trait_id`, `taxonomy_tier`, `source_citation`).
- **Content source = the taxonomy.** Draft from notebook `e70d736e-e7f2-4360-97b6-0948f10e16c9` — primarily the 100-trait Architecture (`efef5d55…`) and tier ranking (`ec49eeb7…`), supported by the rules/strategy/scouting sources. Use the **notebooklm** skill (`notebooklm ask -s efef5d55… "phrase trait N as a flag-football evaluation scenario a coach could judge"`). **Each item maps to one taxonomy trait**, translated into an evaluable flag-football scenario, with `source_citation` recording the trait. **No fabrication** — every item traces to a source; owner (Ambra & Tika) approves before `correct`-free importance points are trusted.
- Distribute the 100 traits across the 10 practical sections via the science map (≈10 per section); keep at least a few `tradeoff` items that pit Tier-1 (mental/IQ) traits against Tier-5/6 (physical) traits so fingerprints spread.
- ✅ **First full draft already generated** (2026-06-07) at `scripts/data/eval-items.json` — 100 items, 10 per section, each mapped to a real taxonomy trait with `science_dimension`, `taxonomy_tier`, and `source_citation`; integrity-checked (every importance item scores 0–4 to its section dimension). Prose is a DRAFT for Ambra & Tika to approve; the mappings are final. The seed script just upserts this file.
**Commit:** `feat(eval): seed 100-item questionnaire from NotebookLM taxonomy (draft prose, final mappings)`.

---

## PHASE 2 — Flag Football IQ knowledge funnel

**Branch:** `flag-iq-funnel`
**Depends on:** Phase 0. **Reuses:** `member_roles`, auth, the runner UX patterns from Phase 1.

> This is the master plan's Phase B, scoped concretely. Keep it **separate** from the Philosophy questionnaire: Philosophy = *opinions* (drives weights); IQ = *knowledge* (drives credibility/visibility). Player IQ has no poll power.

### Task 2.1: Schema — quizzes, questions, attempts

**Files:** `supabase/migrations/005_flag_iq.sql`; apply via MCP. (Same shape as master-plan Phase B B1, kept verbatim for continuity.)
```sql
CREATE TABLE IF NOT EXISTS iq_quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('host','coach','expert','player','general')),
  version INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (category, version)
);
CREATE TABLE IF NOT EXISTS iq_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES iq_quizzes(id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL,
  prompt TEXT NOT NULL,
  choices JSONB NOT NULL,            -- ["A ...","B ...", ...]
  correct_index INTEGER NOT NULL,
  explanation TEXT,
  points INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS iq_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES iq_quizzes(id),
  category TEXT NOT NULL,
  score_raw INTEGER NOT NULL,
  score_max INTEGER NOT NULL,
  score_pct NUMERIC(5,2) NOT NULL,
  answers JSONB NOT NULL,            -- [{question_id, chosen_index, correct}]
  taken_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_iq_attempts_user ON iq_attempts(user_id, category);
CREATE OR REPLACE VIEW iq_best AS
SELECT DISTINCT ON (user_id, category)
  user_id, category, score_pct, taken_at
FROM iq_attempts
ORDER BY user_id, category, score_pct DESC, taken_at DESC;
```
RLS: attempts owner-insert/read; `iq_best` + `score_pct` public read (IQ visible by design); **never expose `correct_index`/`explanation` pre-submit** (server route strips them). **Commit:** `feat(db): Flag IQ quiz schema + iq_best view (migration 005)`.

### Task 2.2 (TDD): `scoreAttempt` pure function

**Files:** `src/lib/iq/score.ts` + `src/lib/iq/score.test.ts`.
**Step 1 — failing test** (from master plan B2):
```ts
test("scoreAttempt computes weighted percentage", () => {
  const qs = [{ id: "1", correct_index: 2, points: 1 }, { id: "2", correct_index: 0, points: 3 }];
  const answers = { "1": 2, "2": 1 };       // q1 right, q2 wrong
  expect(scoreAttempt(qs, answers)).toEqual({ raw: 1, max: 4, pct: 25 });
});
```
**Step 2–4:** fail → implement → pass. **Commit:** `feat(iq): scoreAttempt pure function + tests`.

### Task 2.3: Quiz fetch (answer-stripped) + server submit routes

**Files:** `src/app/api/iq/[category]/items/route.ts` (active quiz, strip `correct_index`/`explanation`); `src/app/api/iq/submit/route.ts` (re-fetch answers, `scoreAttempt`, insert `iq_attempts`, return score + per-question explanations).
**Verify:** `npm run build`; confirm pre-submit payload has no answers. **Commit:** `feat(iq): answer-stripped fetch + server-scored submit`.

### Task 2.4: Quiz UI

**Files:** `src/app/iq/[category]/page.tsx` (server gate) + `src/components/iq/QuizRunner.tsx` (client; reuse the runner interaction patterns from `EvaluationRunner` — extract shared `src/components/eval/useQuizDeck.ts` hook if it reduces duplication, DRY). Post-submit: score, per-question explanations, retake.
**Verify:** `npm run build`; manual run. **Commit:** `feat(iq): quiz runner UI + results with explanations`.

### Task 2.5: Generate IQ question bank from the NotebookLM 🔢

**Files:** `scripts/data/iq-questions.json` + `scripts/seed-iq-quizzes.ts`.
- Use the **notebooklm** skill against notebook `e70d736e…`. Source coverage is confirmed rich (300 sources): official rulebooks (NIRSA, NFHS, NFL FLAG, 2026 Women's Collegiate, IFAF), strategy/coverages (Cover 1–4, zone vs man, route trees, QB reads, flag-pulling, trick plays, red-zone, clock management), 5v5 vs 7v7 differences, Olympic/Pro-Bowl rules, history & international leagues. Draft questions **with citations**; owner verifies correctness before `correct_index` is trusted. **No fabricated answers.**
- ✅ **Starter bank already drafted** (2026-06-07) at `scripts/data/iq-questions.json` — 20 cited questions (rules, scoring, No-Run Zones, QB-rush, man/zone + Cover 1/2/3, Olympic 2028, IFAF rankings/Worlds), each with an explanation + `source_citation`. Every `correct_index` traces to a NotebookLM answer; **owner must verify each before it counts**. Expand toward ~10/category next.
**Commit:** `feat(iq): seed script + NotebookLM-sourced question bank (placeholder)`.

### Task 2.6: Surface IQ on profiles + claim funnel hook

**Files:** Modify `src/app/players/[id]/page.tsx` (Player IQ badge from `iq_best` when claimed), `src/app/coaches/[id]/page.tsx` (Coach IQ), and the claim flow under `src/app/auth/claim/` to add "take your Flag Football IQ" as a verification step.
**Verify:** `npm run build`. **Commit:** `feat(iq): display IQ on profiles; add quiz step to claim funnel`.

---

## PHASE 3 — KNN player similarity (league-adjusted, in Postgres)

**Branch:** `knn-similarity`
**Depends on:** Phase 0 (pgvector). **Reuses:** `players.stats` jsonb, the 10 evaluation dimensions.

**Design:** every player gets a **10-dimension league-adjusted profile vector** (the same 10 dimensions used by the rubric, computed from their verified stats and multiplied by a league-difficulty factor so cross-league comparison is fair). Store as `vector(10)`; index with HNSW; KNN = `ORDER BY profile <-> $query LIMIT k`. This is exactly the owner's ask: input an elite player's profile, retrieve same-DNA gems across leagues, normalized by league difficulty.

### Task 3.1: Schema — league difficulty + player profile vector

**Files:** `supabase/migrations/006_player_vectors.sql`; apply via MCP.
```sql
CREATE TABLE IF NOT EXISTS league_difficulty (
  league_key TEXT PRIMARY KEY,          -- e.g. 'usa_national','ifaf_world','it_fidaf','mx_womens','us_college','us_hs'
  label TEXT NOT NULL,
  difficulty NUMERIC(4,3) NOT NULL,     -- multiplier ~0.5..1.5; 1.0 = baseline
  notes TEXT
);

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS league_key TEXT,           -- maps level/team_designation → league_difficulty
  ADD COLUMN IF NOT EXISTS profile_vector vector(10), -- league-adjusted 10-dim DNA
  ADD COLUMN IF NOT EXISTS profile_built_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_players_profile_vec
  ON players USING hnsw (profile_vector vector_l2_ops);
```
Seed `league_difficulty` with starting multipliers (owner-tunable, 🔢): `usa_national 1.30`, `ifaf_world 1.20`, `it_fidaf 1.00`, `us_college 0.95`, `mx_womens 0.90`, `us_hs 0.70` — **placeholders for owner confirmation.**
**Commit:** `feat(db): league_difficulty + players.profile_vector + HNSW index (migration 006)`.

### Task 3.2 (TDD): `buildPlayerVector` — raw stats → 10-dim league-adjusted profile

**Files:** `src/lib/knn/profile.ts` + `src/lib/knn/profile.test.ts`.
- Pure `buildPlayerVector(stats, leagueDifficulty, dimMaxes)`:
  1. Map the player's verified stats (`stats` jsonb: TDs, completions, INTs, sacks, forty_yard, vertical_jump, caps, etc.) onto the 10 dimensions via a documented `STAT_TO_DIMENSION` mapping.
  2. Min-max normalize each dimension to 0–1 using league-wide `dimMaxes`.
  3. Multiply by `leagueDifficulty` (the league-adjustment that makes cross-league comparable).
  4. Return a length-10 array in fixed dimension order.
- **TDD:** (a) two identical stat lines in different-difficulty leagues yield vectors scaled by the difficulty ratio; (b) a missing stat → 0 for that dimension, never NaN.
**Step 2–4:** fail → implement → pass. **Commit:** `feat(knn): league-adjusted player profile vector builder + tests`.

### Task 3.3: Build-vectors job

**Files:** `src/app/api/admin/knn/rebuild/route.ts` (admin-gated) + `scripts/build-player-vectors.ts`.
- Compute league-wide `dimMaxes`, then for each player run `buildPlayerVector`, write `profile_vector` (as pgvector literal `[v1,...,v10]`), `league_key`, `profile_built_at`.
- **Build vectors for ALL players** (incl. the 284 unverified flagsonly imports), not just verified ones — otherwise KNN/rank covers <25% of the DB. Carry `is_verified` alongside so downstream surfaces can label/weight unverified matches lower.
- Idempotent; safe to re-run after stat verifications change.
**Verify:** `select count(*) from players where profile_vector is not null` ≈ 374. **Commit:** `feat(knn): admin rebuild + script to populate player vectors (all players)`.

### Task 3.4 (TDD): KNN query function + RPC

**Files:** `supabase/migrations/007_knn_rpc.sql` (a `similar_players(target_id uuid, k int)` SQL function using `<->` against the HNSW index, excluding the target, returning id + L2 distance), and `src/lib/knn/similar.ts` wrapper + `src/lib/knn/similar.test.ts`.
- The wrapper calls the RPC and maps distance → a 0–100 **similarity score** (`100 * (1/(1+distance))` or cosine variant — TDD the monotonic mapping: smaller distance → higher score, bounded 0–100).
**Step 2–4:** fail → implement mapping → pass. Apply migration via MCP. **Commit:** `feat(knn): similar_players RPC + similarity-score wrapper + tests`.

### Task 3.5: "Hidden Gems / Similar Players" UI

**Files:** `src/app/players/[id]/page.tsx` (add a "Statistical DNA — Similar Players" section calling the RPC) + `src/components/player/SimilarPlayers.tsx` (cards: player, league badge, similarity %, link). Optionally a `/players/[id]/similar` page and an admin/scout-facing "find gems like X across leagues" search.
**Verify:** `npm run build`; manual: open a national player, see cross-league matches with similarity %. **Commit:** `feat(knn): Similar Players (statistical DNA) section on profiles`.

---

## PHASE 4 — Wire into TF Rank + public explainer

**Branch:** `tf-rank-integration`
**Depends on:** Phases 1–3.

### Task 4.1 (TDD): composite TF rank consuming aggregate weights + league-adjusted dims

**Files:** `src/lib/rankings/tfRank.ts` + `tfRank.test.ts`.
- Pure `computeTfRank({ players, weightsByRole, blend })`:
  - For each player, score the 10 league-adjusted dimensions (reuse `buildPlayerVector` output) against each role's aggregate weights → a Host/Coach/Expert sub-score.
  - Blend role sub-scores by `blend` (Coaches > Experts > Hosts, default 55/30/15 — D5).
  - Apply a **verification confidence factor** so unverified (flagsonly) players rank below equivalent verified players until claimed/verified.
  - Output ordered list → `ranking_national`; `ranking_position` within each `position` (buckets = the constraint values `QB|WR|DB|LB|C|Rusher|Utility`).
- **TDD:** (a) a player favored by the Coaches' aggregate fingerprint outranks one favored only by Hosts; (b) league adjustment lifts a strong player from a tougher league above an inflated stat line from a weak one.
**Commit:** `feat(rankings): composite TF rank from aggregate fingerprints + league-adjusted dims + tests`.

### Task 4.2: Recompute job + snapshot

**Files:** `src/app/api/admin/recompute-rankings/route.ts` + `supabase/migrations/008_ranking_snapshots.sql` (`ranking_snapshots` history) + `src/app/admin/rankings/page.tsx` (run button, last-run, diff preview).
**Verify:** run on seeded data; player ranks update. **Commit:** `feat(rankings): admin recompute + snapshot history`.

### Task 4.3: Public explainer + breakdown

**Files:** `src/app/how-rankings-work/page.tsx` (explain: members' Evaluation Philosophy → per-role weights → blended with league-adjusted stats; IQ as credibility; KNN for discovery — the "better than MaxPreps" story) and `src/app/rankings/page.tsx` (show TF Rank with a per-player breakdown of poll contributions + verified badge). Update companion blog post in `src/lib/static-posts.ts`.
**Verify:** `npm run build`. **Commit:** `feat(rankings): public explainer + ranking breakdown UI`.

### Task 4.4: Wire entry points (nav/footer/sitemap/dashboard/claim)

**Files:** `src/components/layout/Footer.tsx` (add Evaluate + Flag IQ under the Platform/Compete column), `src/app/dashboard/page.tsx` (cards: "Take the Evaluation" + "Test your Flag IQ" + show the member's archetype/IQ once taken), the claim flow under `src/app/auth/claim/` (offer both quizzes as verification steps), and `src/app/sitemap.ts` (add `/evaluate`, `/iq`). **Do not add to the 6-link Nav** — keep it trimmed. Mid-flow pages stay `noindex`.
**Verify:** `npm run build`. **Commit:** `feat(funnels): wire evaluate/IQ entry points into footer, dashboard, claim, sitemap`.

---

## Cross-cutting requirements (every task)
- **Migrations on disk AND DB.** Every schema change = a numbered file in `supabase/migrations/` + MCP `apply_migration`/`execute_sql`. Never drift.
- **RLS on every new table.** Default deny; explicit policies. Answer keys (`eval_items` point maps, `iq_questions.correct_index`) never reach the client pre-submit — always score server-side.
- **No invented content.** Quiz/questionnaire items come from owner + the NotebookLM with citations; league difficulties and rubric overrides come from Ambra & Tika. Placeholders are explicitly `TODO_OWNER`.
- **TDD for all math.** `scoreFingerprint`, `normalizeFingerprint`, `classifyArchetype`, `aggregateRoleWeights`, `scoreAttempt`, `buildPlayerVector`, KNN similarity mapping, `computeTfRank` = pure functions with Vitest tests. UI verified via `npm run build` + preview.
- **Type + build gates.** `npx tsc --noEmit` and `npm run build` green before every push.
- **Brand + UX.** Black/yellow/white only; `font-display uppercase tracking-widest` headings; dependency-free animation (CSS + IntersectionObserver); no chart libs (inline SVG radar).
- **SEO.** New public surfaces (`/evaluate`, `/iq/*`, similar-players, rankings) get `generateMetadata`; keep answer pages `noindex` where they expose flow internals.

## Suggested execution order
Phase 0 → Phase 1 (the headline 100-pt funnel) → Phase 2 (IQ) → Phase 3 (KNN) → Phase 4 (wire it all into the live TF rank + explainer). Phases 2 and 3 are independent of each other and can parallelize after Phase 0.

## Owner inputs to collect (track in `docs/plans/decisions-evaluation.md`)
- D1–D5 above (dimensions, single-questionnaire model, archetypes, the 100 question texts, cross-role blend).
- The Flag IQ question bank + verified answer keys (Phase 2.5, NotebookLM-sourced).
- League-difficulty multipliers (Phase 3.1) + the `level`/`team_designation` → `league_key` mapping.
- **Env vars (Vercel):** `ADMIN_EMAIL` **and** `ADMIN_EMAILS` (both — admin recompute routes); `RESEND_API_KEY` (unblocks claim-outreach, the funnel's top). These don't block building the funnels, only the live admin-recompute + outreach email.

---

*Plan authored 2026-06-07. Kickoff: "Read CLAUDE.md and docs/plans/2026-06-07-evaluation-iq-knn-funnels.md, confirm the Defaults (D1–D5) with me, then execute Phase 0."*
