# Talkin Flag Community Rankings Platform — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Work in `/Users/danielharris/Desktop/Flag/talkinflag/`. Each phase gets its own branch off `main` (names suggested per phase). Commit after every task. `npx tsc --noEmit` and `npm run build` must pass before pushing. Supabase project `wxeuybksowhncalrnttl`.

**Goal:** Turn Talkin Flag from a content + directory site into a community-powered ranking platform: weighted polls (Coaches > Experts > Hosts) drive an original Flag Football player/team ranking system, gated and enriched by a Flag Football IQ quiz funnel, a fundamentals course, profile-update re-engagement loops, monetizable highlight-clip blog content, and international (Spanish/Mexico) expansion via a translation layer.

**Architecture:** Next.js 15 App Router + TypeScript + Tailwind + Supabase (Postgres/RLS/Auth) + Resend + Vercel. The ranking engine is a pure, testable function that combines weighted poll ballots with objective verified stats into `players.ranking_national`/`ranking_position` and new team rankings. Member roles (Host / Coach / Expert / Player) each carry an IQ score and a computed voting weight; ballots aggregate through admin-editable rubric weights ("the 100-pt rubric"). Content (blog highlights, course lessons) drives return traffic; translation + Mexico league depth extend reach globally.

**Tech Stack:** Next.js 15, React 19 Server Components, Supabase JS v2, Postgres RLS, Tailwind, `next-intl` (translation), existing `YouTubeFacade`/`SpotifyPlayer`/`RichText` components.

---

## How to read this plan

This is a **multi-milestone roadmap**, not a single sprint. Phases are ordered by dependency. Phases A, H1–H3 are small and can ship immediately. Phases B→F are the platform build and depend on each other. Phase G (international) can run in parallel after B. Phase H is the parked backlog — recorded so nothing is lost.

**Before starting the platform build (Phase B onward), resolve the open decisions in [§ Decisions Needed](#decisions-needed-resolve-before-phase-b).** Several specifics (exact rubric weights, quiz questions, which Mexico league) require Ambra & Tika input and are owner-supplied content, not engineering guesses. Where content is missing, build the schema + scaffolding and seed with clearly-marked `TODO_OWNER` placeholders (same pattern already used for blog video IDs).

**Status legend:** ⬜ not started · 🔢 owner input required · 🅿️ tabled/parked

---

## Existing building blocks (already in the codebase — reuse, don't rebuild)

Confirmed via live schema (`wxeuybksowhncalrnttl`) and `src/app` tree:

| Capability | Where |
|---|---|
| Players DB (374 rows) | `players` table; `ranking_national`, `ranking_position`, `stats` jsonb, `is_verified`, `is_claimed` |
| Coaches (4 rows) | `coaches` table — `level` (high_school/college/national), `is_verified`, `status`, `years_coaching`, `wins`, `losses`, `title`, `team`, `philosophy`; routes `/coaches`, `/coaches/apply`, `/admin/coaches` |
| Experts/scouts | `scouts` + `scout_applications` tables; routes `/scouts/apply`, `/admin/scouts` |
| Stat verification flow | `stat_verifications` table; `/admin/verifications`, `/dashboard/verify` |
| Recruiting | `recruiting_interests`, `coach_roster_spots`, `coach_player_notes`, `coach_profile_views` |
| Follows / community | `follows` table; `/community`, `FollowButton` |
| Events + results | `events` (32), `event_results` (83); `/events`, `/results`, `/admin/events` |
| Highlights / plays | `highlight_submissions`; `/plays`, `/admin/highlights` |
| Featured athlete | `featured_athlete`; `/athletes/featured`, `/admin/featured` |
| Rankings surface | `/rankings`, `/how-rankings-work`, `src/lib/world-rankings.ts`, `src/components/rankings/` |
| Blog | `src/lib/static-posts.ts`, `src/app/blog/[slug]/page.tsx`, `RichText`, `YouTubeFacade` |
| Podcast | `/podcast`, `SpotifyPlayer` (built, env-gated), `src/lib/youtube.ts` |

> **Migrations note:** Only `supabase/migrations/001_initial_schema.sql` exists on disk; later schema changes were applied directly via MCP. **Every new table in this plan must be added as a real migration file** in `supabase/migrations/` (e.g. `002_...sql`) AND applied via the Supabase MCP `apply_migration` so disk and DB stay in sync. Drop the leftover `_backup_players_20260606` / `_backup_events_20260606` tables first (see Phase H3).

---

## Decisions Needed (resolve before Phase B)

These are owner/Ambra-&-Tika inputs. Capture answers in `docs/plans/decisions-rankings.md` as they come in.

1. **Rubric weights (the "100-pt" split).** Final numeric weights for: Coaches Poll vs Experts Poll vs Hosts Poll contribution to the Total Player Ranking (owner stated order: Coaches > Experts > Hosts). Suggested starting point to confirm: Coaches 55 / Experts 30 / Hosts 15, with objective verified-stats as a separate multiplier. **Confirm or override.**
2. **Coach weight formula inputs.** Confirm the factors and their relative weight: coaching level (HS top division/A vs college D1/sanctioned vs national/Olympic), win %, years of experience, postseason appearances, championships, title-game appearances, IQ score.
3. **Coach eligibility bar.** Owner stated: HS head coach who won a championship OR reached the title game AND coached at the top-3 level/division/A in their state; college head coach at D1/sanctioned level; national/Olympic head & assistant coaches treated like college tier. Confirm exact thresholds and how to verify them.
4. **Expert eligibility + weight.** Who qualifies (journalists, analysts, fans who apply), minimum IQ score to vote, and how activity (events covered, clinics hosted) boosts weight.
5. **IQ quiz content.** Question banks for each of the 4 quizzes (Host, Coach, Expert, Player). ~Owner/staff-authored. How much IQ influences voting weight (owner: "by how much the Coaches, Hosts, Experts think IQ matters" — i.e. this is itself a tunable weight).
6. **Mexico league.** Which single top youth/adult women's league in Mexico to add, and the one extra depth level (league + its sanctioned teams), mirroring USA college + sanctioned HS.
7. **Translation scope + library.** Confirm `next-intl` (recommended) and launch languages (English + Spanish first). Which content gets translated first (National/Olympic players & coaches, then Mexico).
8. **Monetization linkage.** Confirm: each blog highlight still-frame/clip links to a published YouTube Short URL (owner supplies URLs from their clip app). TikTok handled later (Phase H1).
9. **Course scope.** "Flag Football Fundamentals" — number of modules, who authors lessons, whether free or gated.

---

# PHASE A — Blog Highlight Clips + Shorts (monetizable content engine)

**Branch:** `blog-highlight-clips`
**Goal:** Replace the "wait for full-episode YouTube ID" approach with the owner's new workflow: clip the best moments → transcribe just those → embed a still-frame or short clip next to the verbatim quote → link each frame/clip to its published **YouTube Short** (monetization). Full-episode embed stays optional.

**Why first:** Small, unblocks the tabled blog Q&A item, and the owner can produce content immediately with their clip app.

**Owner workflow this enables (document in `docs/owner-guides/blog-highlights.md`):**
1. Run episode through clip app → pick best highlight(s).
2. Transcribe the clip → get the verbatim quote + speaker.
3. Export a still frame (or a short MP4/GIF) → drop in `public/blog/highlights/<slug>/`.
4. Publish the same clip as a YouTube Short → copy the Short URL.
5. Add a `highlights[]` entry to the post (quote + speaker + image + shortUrl).

### Task A1: Extend `StaticPost` with a highlights array

**Files:** Modify `src/lib/static-posts.ts` (the `StaticPost`/`FaqItem` interfaces, ~line 9-24).

**Step 1:** Add a `Highlight` interface and an optional `highlights?: Highlight[]` field:

```ts
export interface Highlight {
  quote: string;        // verbatim transcribed quote — NEVER paraphrase or invent
  speaker: string;      // e.g. "Vanita Krouch"
  speakerRole?: string; // e.g. "QB, USA Women's National Team"
  imageUrl?: string;    // still frame, e.g. "/blog/highlights/vanita/clip-1.jpg"
  clipUrl?: string;     // optional short looping mp4/gif in /public
  youtubeShortUrl?: string; // published Short — image/clip links here (monetization)
  timestamp?: string;   // e.g. "12:04" — where in the full episode
}
```

Add `highlights?: Highlight[];` to `StaticPost`.

**Step 2: Verify** `npx tsc --noEmit` → clean.

**Step 3: Commit** `feat(blog): add Highlight type (quote + still frame + YouTube Short link) to StaticPost`.

### Task A2: Build a `BlogHighlight` component

**Files:** Create `src/components/blog/BlogHighlight.tsx`.

Render a quote block: still-frame image (or `<video>` for clip) on one side, large pull-quote + speaker attribution on the other. If `youtubeShortUrl` is set, the image/clip is a link (`target="_blank"`) with a small "▶ Watch the Short" affordance and brand-yellow styling. No image → quote-only card (graceful). Reuse brand tokens (`brand-yellow`, `font-display`, `tracking-widest`). Lazy-load images (`loading="lazy"`, Next `<Image>` if remote-safe; local frames can use `<img>`).

**Verify:** `npx tsc --noEmit`. **Commit:** `feat(blog): BlogHighlight component (frame/clip + quote, links to monetized Short)`.

### Task A3: Render highlights in the blog template

**Files:** Modify `src/app/blog/[slug]/page.tsx` (static-post branch). Import `BlogHighlight`. After the body (`<RichText>`), if `staticPost.highlights?.length`, render an "Episode Highlights" section mapping each to `<BlogHighlight>`. Keep the existing `youtubeVideoId` full-episode embed as the optional bottom-of-article element.

**Verify:** `npx tsc --noEmit` + `npm run build`; grep prerendered HTML of a test post to confirm the Short link renders. **Commit:** `feat(blog): render episode highlight clips + Short links in article template`.

### Task A4: Backfill highlights into the 5 interview posts (owner content)

🔢 **Owner input:** transcripts/clips/Short URLs for Sowers, Clark-Robinson, Krouch, Doucette, Flores.

For each post in `src/lib/static-posts.ts`, add a `highlights: [...]` array using **verbatim** quotes from the transcript and the owner's Short URLs/frames. Until supplied, leave a single placeholder entry with `quote: "TODO_OWNER — verbatim quote from clip"` and omit it from render (guard: skip entries whose quote starts with `TODO_OWNER`). **Do NOT invent quotes** (see @superpowers:writing-plans rule and existing CLAUDE.md guardrail).

**Verify + Commit** per post or as one batch: `content(blog): add verbatim highlight quotes + Shorts to interview posts`.

### Task A5: Owner guide

**Files:** Create `docs/owner-guides/blog-highlights.md` with the 5-step workflow above. **Commit.**

---

# PHASE B — Member Roles + Flag Football IQ Quiz engine

**Branch:** `iq-quiz-engine`
**Goal:** Establish the four member personas (Host, Coach, Expert, Player) and a versioned IQ quiz per persona. IQ scores are stored, visible, and retakeable. Quiz completion plugs into the claim/verify funnel. Players get a Player IQ on their profile but **no poll power**.

**Depends on:** Decisions §5. **Reuses:** Supabase auth, `coaches`, `scouts`, `players.claimed_by`.

### Task B1: Schema — roles, quizzes, questions, attempts

**Files:** Create `supabase/migrations/002_iq_and_roles.sql`; apply via MCP `apply_migration`.

```sql
-- A unified member-role record per auth user (a user can hold multiple roles over time)
CREATE TABLE IF NOT EXISTS member_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('host','coach','expert','player')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS iq_quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('host','coach','expert','player')),
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
  choices JSONB NOT NULL,           -- ["A ...","B ...",...]
  correct_index INTEGER NOT NULL,
  explanation TEXT,
  points INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS iq_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES iq_quizzes(id),
  category TEXT NOT NULL,
  score_raw INTEGER NOT NULL,        -- points earned
  score_max INTEGER NOT NULL,        -- points possible
  score_pct NUMERIC(5,2) NOT NULL,   -- 0–100, the published "IQ"
  answers JSONB NOT NULL,            -- [{question_id, chosen_index, correct}]
  taken_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_iq_attempts_user ON iq_attempts(user_id, category);

-- Convenience: latest/best IQ per user+category (materialized via view)
CREATE OR REPLACE VIEW iq_best AS
SELECT DISTINCT ON (user_id, category)
  user_id, category, score_pct, taken_at
FROM iq_attempts
ORDER BY user_id, category, score_pct DESC, taken_at DESC;
```

Add RLS: users can insert their own attempts and read their own; `iq_best` and approved IQ scores are publicly readable (IQs are visible by design). Quizzes/questions are read-only to public except `correct_index`/`explanation` which must NOT be exposed pre-submit (fetch questions through a server route that strips answers).

**Verify:** MCP `list_tables` shows new tables. **Commit:** `feat(db): IQ quiz + member_roles schema (migration 002)`.

### Task B2: TDD the scoring function

**Files:** Create `src/lib/iq/score.ts` + `src/lib/iq/score.test.ts` (use the project's test runner; if none configured, add Vitest — see @superpowers:test-driven-development).

**Step 1 — failing test:**
```ts
// given questions with points and an answer key, scoreAttempt returns raw/max/pct
test("scoreAttempt computes weighted percentage", () => {
  const qs = [{ id: "1", correct_index: 2, points: 1 }, { id: "2", correct_index: 0, points: 3 }];
  const answers = { "1": 2, "2": 1 }; // q1 right, q2 wrong
  expect(scoreAttempt(qs, answers)).toEqual({ raw: 1, max: 4, pct: 25 });
});
```
**Step 2:** run → fails. **Step 3:** implement pure `scoreAttempt`. **Step 4:** run → passes. **Step 5: Commit** `feat(iq): scoreAttempt pure function + tests`.

### Task B3: Quiz-taking UI + submit route

**Files:** Create `src/app/iq/[category]/page.tsx` (server: load active quiz + questions **without** answers), `src/components/iq/QuizRunner.tsx` (client: step through questions, submit), `src/app/api/iq/submit/route.ts` (server: re-fetch correct answers, call `scoreAttempt`, insert `iq_attempts`, return score + per-question explanations).

Security: never send `correct_index`/`explanation` to the client before submission. Score server-side only.

**Verify:** `npm run build`; manual: take a seeded quiz, see score + retake button. **Commit:** `feat(iq): quiz runner UI + server-scored submit route`.

### Task B4: Seed quiz content (owner)

🔢 **Owner input (Decisions §5):** question banks. Create `scripts/seed-iq-quizzes.ts` that upserts the 4 quizzes + questions from `scripts/data/iq-questions.json`. Until authored, seed 5 placeholder questions per category marked `TODO_OWNER` so the flow is testable. **Commit:** `feat(iq): seed script + placeholder question banks`.

### Task B5: Surface IQ on profiles + claim funnel hook

**Files:** Modify `src/app/players/[id]/page.tsx` (show Player IQ badge when the claimed user has a `player` IQ attempt — query `iq_best`), `src/app/coaches/[id]/page.tsx` (Coach IQ), and the claim flow under `src/app/auth/claim/` so that "take your Flag Football IQ quiz" is a step toward full verification. Add IQ to the `Person` JSON-LD as `knowsAbout` reinforcement (optional).

**Verify:** `npm run build`. **Commit:** `feat(iq): display IQ on player/coach profiles; add quiz step to claim funnel`.

---

# PHASE C — Polls + Voter Weighting (Hosts / Coaches / Experts)

**Branch:** `polls-and-weighting`
**Goal:** Three weighted polls. Eligible voters submit ranked ballots for players (and later teams). Each voter has a computed weight; ballots aggregate into per-poll ranks. This is the AP-Poll/Coaches-Poll analog, customized for flag football.

**Depends on:** Phase B (roles + IQ), Decisions §1–§5. **Reuses:** `coaches`, `scouts`.

### Task C1: Schema — coach credentials, polls, ballots, weights

**Files:** `supabase/migrations/003_polls.sql` + MCP apply.

```sql
-- Extend coaches with the credentials that drive Coach weight (Decisions §2/§3)
ALTER TABLE coaches
  ADD COLUMN IF NOT EXISTS classification TEXT,          -- e.g. state division/class (HS) or 'D1','sanctioned'
  ADD COLUMN IF NOT EXISTS postseason_appearances INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS title_game_appearances INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS championships INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_national_staff BOOLEAN DEFAULT false; -- national/olympic head or assistant

-- A poll cycle (e.g. weekly/monthly), per category
CREATE TABLE IF NOT EXISTS polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('coaches','experts','hosts')),
  subject_type TEXT NOT NULL DEFAULT 'player' CHECK (subject_type IN ('player','team')),
  period_label TEXT NOT NULL,        -- e.g. "2026-W23"
  opens_at TIMESTAMPTZ DEFAULT NOW(),
  closes_at TIMESTAMPTZ,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS poll_ballots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  voter_user_id UUID NOT NULL REFERENCES auth.users(id),
  voter_weight NUMERIC(8,3) NOT NULL,  -- snapshot of weight at submit time
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (poll_id, voter_user_id)
);

CREATE TABLE IF NOT EXISTS poll_ballot_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ballot_id UUID NOT NULL REFERENCES poll_ballots(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL,           -- player.id or team id
  rank INTEGER NOT NULL               -- 1 = best; points = (N - rank + 1)
);

-- Admin-editable rubric weights (the "100-pt" config + voter-weight tuning)
CREATE TABLE IF NOT EXISTS ranking_weights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,           -- e.g. 'poll.coaches','poll.experts','poll.hosts',
                                      --      'coach.level.college','coach.winpct','iq.influence', ...
  value NUMERIC(8,3) NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

RLS: only approved voters of the matching role may insert ballots; published poll results are public; `ranking_weights` admin-only write, public read. **Commit:** `feat(db): polls, ballots, coach credentials, ranking_weights (migration 003)`.

### Task C2: TDD voter-weight functions

**Files:** `src/lib/rankings/weight.ts` + `weight.test.ts`.

Implement pure functions reading from a `weights` map (the `ranking_weights` rows) + a voter record:
- `coachWeight(coach, iqPct, weights)` → number. Factors (Decisions §2): base by level (HS top-division / college-D1-sanctioned / national-olympic), win% = wins/(wins+losses), years_coaching, postseason_appearances, title_game_appearances, championships, IQ influence.
- `expertWeight(scout, iqPct, activity, weights)` → number.
- `hostWeight(weights)` → flat baseline.

**TDD example:**
```ts
test("coachWeight rewards championships and win pct", () => {
  const w = makeWeights({ "coach.base.college": 10, "coach.winpct": 5, "coach.championship": 3, "iq.influence": 0.2 });
  const a = coachWeight({ level:"college", classification:"D1", wins:18, losses:2, championships:2, ...}, 90, w);
  const b = coachWeight({ level:"college", classification:"D1", wins:10, losses:10, championships:0, ...}, 90, w);
  expect(a).toBeGreaterThan(b);
});
```
Run → fail → implement → pass → **Commit** `feat(rankings): voter-weight functions + tests`.

### Task C3: Ballot UI + submit route

**Files:** `src/app/polls/[category]/vote/page.tsx` (gated to approved role), `src/components/rankings/BallotBuilder.tsx` (drag/search players into a ranked top-N), `src/app/api/polls/ballot/route.ts` (validate eligibility, snapshot `voter_weight` via Task C2, upsert ballot + entries).

**Verify:** `npm run build`; manual ballot submit as a seeded coach. **Commit:** `feat(polls): ranked ballot builder + eligibility-gated submit`.

### Task C4: Poll aggregation + per-poll standings

**Files:** `src/lib/rankings/aggregate.ts` + tests; `src/app/polls/[category]/page.tsx` (published standings).

Pure `aggregatePoll(ballots, entries)` → weighted points per subject = Σ over ballots of `voter_weight × (N − rank + 1)`; sort desc → ranked list. TDD with a 2-voter fixture proving the higher-weight voter moves the ranking more. Render standings with each subject's weighted score and #voters. **Commit:** `feat(polls): weighted aggregation + standings pages`.

### Task C5: Voter transparency

**Files:** `src/app/coaches/[id]/page.tsx` + a new `/polls/voters` page. Show each coach/expert's IQ and their **influence** (their `voter_weight` as a share of the poll total) — the owner explicitly wants "Coaches can see other Coaches and how much their opinion affects the weight." **Commit:** `feat(polls): voter influence + IQ transparency views`.

---

# PHASE D — Total TF Ranking Algorithm (player + team)

**Branch:** `tf-ranking-algorithm`
**Goal:** Combine the three published polls (Coaches > Experts > Hosts) with objective verified stats into the canonical `players.ranking_national` / `ranking_position`, plus new team rankings. This is the differentiator vs MaxPreps: a transparent, community-weighted, multi-constituency rank.

**Depends on:** Phase C. **Decisions §1.**

### Task D1: TDD the composite ranking function

**Files:** `src/lib/rankings/tfRank.ts` + `tfRank.test.ts`.

Pure `computeTfRank({ coachesStandings, expertsStandings, hostsStandings, verifiedStatScore, weights })`:
- Normalize each poll's weighted scores to 0–100.
- Blend by rubric weights (`poll.coaches`, `poll.experts`, `poll.hosts` — Coaches highest).
- Add objective component from approved `stat_verifications` (verified stats lift rank).
- Output ordered player list → assign `ranking_national`; compute `ranking_position` within each `position`.

**TDD:** prove (a) a player #1 on the Coaches poll but low elsewhere still outranks a player #1 only on Hosts; (b) verified stats break ties. Run → fail → implement → pass. **Commit:** `feat(rankings): composite TF rank function + tests`.

### Task D2: Team rankings

**Files:** extend `src/lib/world-rankings.ts` (already holds world-ranking/Olympic scaffolding) or add `src/lib/rankings/teamRank.ts`. Aggregate team strength from `event_results` (placements) + team-subject poll ballots. **Commit:** `feat(rankings): team ranking computation`.

### Task D3: Recompute job + admin trigger

**Files:** `src/app/api/admin/recompute-rankings/route.ts` (admin-only: pull published standings + weights, run D1/D2, write `ranking_national`/`ranking_position`, store a `ranking_snapshots` row for history), `src/app/admin/rankings/page.tsx` (button + last-run + preview diff). Add `ranking_snapshots` table in `supabase/migrations/004_ranking_snapshots.sql`.

**Verify:** run against seeded data, confirm player ranks update. **Commit:** `feat(rankings): admin recompute + snapshot history`.

### Task D4: Admin rubric editor

**Files:** `src/app/admin/rankings/weights/page.tsx` — CRUD over `ranking_weights` (the 100-pt rubric + voter-weight knobs). 🔢 Ambra & Tika set the numbers here (Decisions §1/§2) instead of hard-coding. **Commit:** `feat(rankings): admin editor for rubric/voter weights`.

### Task D5: Rewrite `/how-rankings-work` + `/rankings`

**Files:** `src/app/how-rankings-work/page.tsx` (explain the 3-poll weighted model, IQ influence, verified stats — the "better than MaxPreps" story), `src/app/rankings/page.tsx` (show TF Rank with a breakdown: poll contributions + verified badge). Update the companion blog post `how-talkin-flag-ranks-players` in `static-posts.ts`. **Commit:** `feat(rankings): public explainer + ranking breakdown UI`.

---

# PHASE E — Flag Football Fundamentals Course (return-traffic loop)

**Branch:** `fundamentals-course`
**Goal:** On-site course that teaches fundamentals and ties to IQ — users take lessons, then retake the IQ to raise their score and (for coaches/experts) their credibility/influence. Drives repeat visits.

**Depends on:** Phase B. **Decisions §9.**

### Task E1: Schema
`supabase/migrations/005_courses.sql`: `courses`, `lessons` (course_id, ordinal, title, body, video_url), `course_progress` (user_id, lesson_id, completed_at). RLS: lessons public-readable (or gated per §9); progress per-user. **Commit.**

### Task E2: Course UI
`src/app/learn/page.tsx` (catalog), `src/app/learn/[course]/[lesson]/page.tsx` (lesson + mark-complete), progress bar. Reuse `RichText`/`YouTubeFacade`. **Commit.**

### Task E3: Course ↔ IQ loop
On course completion, surface "Retake your IQ to raise your score." Show IQ trend on the user dashboard (`src/app/dashboard/`). **Commit.**

### Task E4: Seed first course (owner content) 🔢
`scripts/data/course-fundamentals.json` + seed script. Placeholder lessons until authored. **Commit.**

---

# PHASE F — Profile-Update & Career-Event Re-engagement Loop

**Branch:** `career-updates`
**Goal:** Let coaches/experts submit credential/career updates (new championship, postseason, role change, event covered, clinic hosted). Approved updates recompute their voter weight and can trigger ranking refresh — the "reasons to come back" engine the owner described.

**Depends on:** Phases C/D. **Reuses:** the `stat_verifications` admin-review pattern.

### Task F1: Schema
`supabase/migrations/006_career_updates.sql`: `career_updates` (subject_user_id, role, kind ['championship','postseason','title_game','role_change','event_covered','clinic_hosted',...], detail jsonb, evidence_url, status pending/approved/rejected, reviewed_by/at). **Commit.**

### Task F2: Submission UI + review
`src/app/dashboard/credentials/page.tsx` (submit), `src/app/admin/credentials/page.tsx` (approve → write through to `coaches`/expert fields → mark for weight recompute). **Commit.**

### Task F3: Weight recompute on approval
On approval, recompute that voter's weight and flag rankings as stale (admin sees "recompute recommended"). Optionally notify followers via existing `follows`. **Commit.**

### Task F4: Profile freshness signals
Show "updated" timestamps and recent career events on coach/expert/player profiles to reward returning + help recruits. **Commit.**

---

# PHASE G — International Expansion: Translation + Mexico Depth + Brand

**Branch:** `i18n-mexico`
**Goal:** Make the brand universal/translatable, ship a translation layer (English + Spanish first), and add Mexico's single top women's league with one extra depth level (league + sanctioned teams), mirroring USA's college + sanctioned-HS depth. Start with National/Olympic players & coaches, then Mexico.

**Depends on:** can start after Phase B. **Decisions §6, §7.**

### Task G1: Translation layer
Add `next-intl` (Decisions §7). Configure locales `en`, `es`; wrap layout; extract UI strings to `messages/en.json`, `messages/es.json`. Add a language switcher in `src/components/layout/Nav.tsx`. **Commit:** `feat(i18n): next-intl scaffolding + en/es + switcher`.

### Task G2: Translatable content model
For dynamic content (player bios, blog posts, course lessons), decide per §7: machine translation at render vs stored translations. Recommended start: store `*_es` variants for high-value records (National/Olympic players/coaches, the 5 interview posts) in a `translations` table keyed by (entity_type, entity_id, field, locale). Migration `007_translations.sql`. **Commit.**

### Task G3: Mexico league depth 🔢
Decisions §6 — add the chosen top Mexican women's league. Extend the data model if needed (a `leagues` concept or reuse `school_or_team` + `level` + `country_code='MX'`). Import the top league's teams/players (one depth level: league + sanctioned teams), tagged like the flagsonly import (`stats.source`, `is_verified=false`). Mirror `scripts/import-flagsonly.ts`. **Commit.**

### Task G4: Brand universalization
Audit copy/taglines for translatability; ensure names render across locales; document brand guidance in `docs/brand-international.md` (universal, transcribable, translatable to reflect global guests/fans). **Commit.**

---

# PHASE H — Tabled / Parked Backlog (recorded, not scheduled)

These are explicitly deferred. Keep them here so nothing is lost; pull into a milestone when ready.

### H1 🅿️ Gallery redesign + TikTok
- Redesign `/media` gallery (`src/app/media/page.tsx`) — currently masonry + IG embeds.
- Add TikTok embeds once the account is set up (mirror the IG/`SpotifyPlayer` embed pattern). Owner action: provide TikTok handle/embed IDs.

### H2 🅿️/🔢 Podcast audio widget activation
- Widget already built (`src/components/episodes/SpotifyPlayer.tsx`, env-gated in `/podcast`).
- Owner action: set `NEXT_PUBLIC_SPOTIFY_SHOW_ID` in Vercel (or send the Show ID).

### H3 ✅-pending Drop DB backup tables
- After confirming live data is correct, drop `_backup_players_20260606` and `_backup_events_20260606` (still present per live schema). Run in Supabase SQL editor or MCP:
  ```sql
  DROP TABLE IF EXISTS _backup_players_20260606;
  DROP TABLE IF EXISTS _backup_events_20260606;
  ```
- **Do this before Phase B migrations** to keep the schema clean.

### H4 🔢 Outstanding owner actions / env vars (carried from CLAUDE.md)
| Item | Unlocks |
|---|---|
| Ambra's host photos → `public/hosts-hero.jpg`, `public/ambra.jpg`, `public/tika.jpg` | `/about` hero |
| `RESEND_API_KEY` (Vercel) | Contact form, welcome email, **profile-claim outreach** (ties to Phase B funnel) |
| `YOUTUBE_API_KEY` (Vercel) | Live episode fetch + (legacy) full-episode blog IDs — largely superseded by Phase A Shorts |
| Spotify Show ID | Phase H2 |
| TikTok setup | Phase H1 |
| Mexico league pick | Phase G3 |
| Domain decision (talkinflag.com vs talkinflagshow.com) | SEO/Search Console |
| `PRINTFUL_API_KEY` | Merch store (code done) |

### H5 🅿️ Profile-claim outreach campaign
- Email flow for the 284 flagsonly-imported athletes to claim profiles (needs `RESEND_API_KEY`). Now framed as the **top of the IQ/verify funnel** (Phase B) — claiming → take Player IQ → get verified. Build the outreach as the entry point once Phase B is live.

---

## Cross-cutting requirements (apply to every phase)

- **Migrations on disk AND DB.** Every schema change = a numbered file in `supabase/migrations/` + MCP `apply_migration`. Never drift.
- **RLS on every new table.** Default deny; explicit policies. IQ scores/poll results are public-read by design; ballots/attempts are owner-write.
- **No invented content.** Quotes come from transcripts; rankings/weights come from Ambra & Tika; no fabricated stats. (Same guardrail that governed the interview articles.)
- **Type + build gates.** `npx tsc --noEmit` and `npm run build` green before every push.
- **Pure logic is TDD'd.** Scoring, weights, aggregation, TF rank = pure functions with tests (@superpowers:test-driven-development). UI verified via build + manual/preview.
- **SEO.** New public surfaces (polls, rankings, learn, profiles) get `generateMetadata` + appropriate JSON-LD, consistent with existing patterns.
- **i18n-ready.** From Phase G on, new UI strings go through `next-intl`, not hard-coded.

## Suggested execution order

A → H3 (cleanup) → B → C → D → (E ∥ F ∥ G) → H (as owner unblocks).

A is shippable now. B–D are the core platform and must be sequential. E, F, G can parallelize once D lands. H items ship whenever their owner inputs arrive.

---

## Open loose ends captured (checklist — confirm none missed)

- [x] Blog Q&A upgrade → reframed as Phase A (clips + frames + verbatim quotes + Shorts monetization)
- [x] YouTube Shorts monetization linkage → Phase A (A2/A3/A4)
- [x] Hosts Poll (Ambra & Tika + staff) → Phase C
- [x] Coaches Poll + eligibility + weighting → Phase C (C1–C2), Decisions §2/§3
- [x] Experts Poll (journalists/analysts/fans who apply) → Phase C, Decisions §4
- [x] National/Olympic head + assistant coaches weighted like college → C1 (`is_national_staff`), Decisions §2
- [x] IQ quizzes ×4 (Host/Coach/Expert/Player) → Phase B
- [x] Player IQ on profile, no poll power → B5
- [x] 100-pt rubric weights as funnel/admin-config → D4 + `ranking_weights`, Decisions §1
- [x] Coaches > Experts > Hosts weighting of total rankings → Phase D (D1)
- [x] IQ visibility + coach-sees-coach influence → C5
- [x] Flag Football Fundamentals course + retake-to-improve loop → Phase E
- [x] Profile/career updates re-engagement (HS championship, postseason, role change, event covered, clinic hosted) → Phase F
- [x] Mexico top league, one extra depth level → Phase G3, Decisions §6
- [x] Universal/transcribable/translatable brand → Phase G4
- [x] Translation feature (start National/Olympic, then Mexico) → Phase G1/G2, Decisions §7
- [x] Gallery redesign → Phase H1
- [x] TikTok integration → Phase H1
- [x] Spotify activation → Phase H2
- [x] Drop backup tables → Phase H3
- [x] Profile-claim outreach (284 flagsonly) → Phase H5, tied to Phase B funnel
- [x] Carried owner actions/env vars → Phase H4

---

*Plan authored 2026-06-06. Start in a fresh session with: "Read CLAUDE.md and docs/plans/2026-06-06-community-rankings-platform.md, resolve the Decisions Needed section with me, then execute Phase A."*
