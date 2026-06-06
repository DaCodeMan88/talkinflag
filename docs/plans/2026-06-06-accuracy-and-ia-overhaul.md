# Accuracy & Information-Architecture Overhaul — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Work in `/Users/danielharris/Desktop/Flag/talkinflag/` on a feature branch off `main`. Commit after every task.

**Goal:** Make the Talkin Flag site and database accurate and current — purge fake/demo players, seed real 2025/2026 national + Olympic + junior rosters, import the flagsonly.com player index, refresh events, trim the top nav, rebalance the footer, clean the About page, rebrand Episodes → Podcast with topic organization + an embedded audio player, and add a brand/rankings explainer plus a stronger Scores & Results and College experience.

**Architecture:** Next.js 15 App Router + TypeScript + Tailwind + Supabase. Player/roster data lives in the Supabase `players` table (`stats` JSONB holds extended fields). Events live in the `events` table. Episodes are pulled live from YouTube (`src/lib/youtube.ts`) with a mock fallback. Navigation/Footer are static React components. Blog content is static (`src/lib/static-posts.ts`). All DB writes go through the Supabase MCP (`execute_sql` / `apply_migration`, project `wxeuybksowhncalrnttl`); web research uses the firecrawl skills or WebFetch.

**Tech Stack:** Next.js 15, TypeScript, Tailwind v3, Supabase (Postgres + RLS), Resend, Vercel, YouTube Data API v3.

**Brand:** Yellow `#FDDD58` (`brand-yellow`) / Black `#000000` (`brand-black`) / White. Fonts: Anton (`font-display`, uppercase tracking-widest) + Inter (`font-body`).

---

## Pre-flight (do once before Phase 1)

**Step 0.1 — Create a working branch**

```bash
cd /Users/danielharris/Desktop/Flag/talkinflag
git checkout -b accuracy-ia-overhaul
git status   # expect: clean tree on new branch
```

**Step 0.2 — Snapshot the players + events tables (rollback safety)**

Run via Supabase MCP `execute_sql` (project `wxeuybksowhncalrnttl`):

```sql
CREATE TABLE IF NOT EXISTS _backup_players_20260606 AS TABLE players;
CREATE TABLE IF NOT EXISTS _backup_events_20260606 AS TABLE events;
SELECT
  (SELECT count(*) FROM _backup_players_20260606) AS players_backed_up,
  (SELECT count(*) FROM _backup_events_20260606)  AS events_backed_up;
```
Expected: `players_backed_up = 107`, `events_backed_up ≥ 0`. **Do not proceed without a successful backup.**

> **Decision points to confirm with the owner before/while executing** (defaults chosen so execution is never blocked):
> - **Top-nav set** (Phase 5) — recommended 6: `Players · Teams · Podcast · Events · Blog · About`. Everything else demoted to footer + in-page links.
> - **About page** (Phase 7) — keep the **second** bio set (the `HostCard` bios) + Ambra-supplied photos; delete the `HostsHero` duplicate bio block. Need the actual image files from Ambra.
> - **flagsonly import scope** (Phase 3) — default: import as **unclaimed, unverified** reference profiles tagged `source: 'flagsonly'`, HS + college only, dedupe against existing names.

---

## PHASE 1 — Remove fake profiles & fix data integrity

**Goal:** Delete the 15 fictional demo players, remove duplicate HS entries, and normalize country/state values. All DB work via Supabase MCP `execute_sql`.

### Task 1.1: Quarantine and delete the fake demo players

**Step 1: Verify the target set before deleting**

The fake/demo players are the `2026-05-24` seed batch (generic fictional names, no real roster basis).

```sql
SELECT id, first_name, last_name, school_or_team, level, created_at::date
FROM players
WHERE created_at::date = '2026-05-24'
ORDER BY level, last_name;
```
Expected: 15 rows — Carlos Mendes, Amara Diallo, Priya Nair, Sofia Esposito, Elena Russo, Kenji Tanaka, Marcos Delgado, Nia Okonkwo (national), Danielle Porter, Destiny Clark (college), Isabella Montoya, Tyra Johnson (HS), Aaliyah Washington, Jaylen Reeves, Marcus Greene (Team USA National).

**Step 2: Confirm none are referenced by claims/results/highlights/follows**

```sql
SELECT 'follows' t, count(*) FROM follows WHERE player_id IN (SELECT id FROM players WHERE created_at::date='2026-05-24')
UNION ALL SELECT 'stat_verifications', count(*) FROM stat_verifications WHERE player_id IN (SELECT id FROM players WHERE created_at::date='2026-05-24')
UNION ALL SELECT 'highlights', count(*) FROM highlights WHERE player_id IN (SELECT id FROM players WHERE created_at::date='2026-05-24');
```
Expected: all `0`. If any are non-zero, stop and report — those FKs must be handled first.

**Step 3: Delete**

```sql
DELETE FROM players WHERE created_at::date = '2026-05-24';
SELECT count(*) AS remaining FROM players;   -- expect 92
```

**Step 4: Commit (documentation only — DB change already applied)**

```bash
git commit --allow-empty -m "chore(db): remove 15 fake demo player profiles (2026-05-24 batch)"
```

### Task 1.2: De-duplicate high-school players

**Step 1: Find duplicates**

Two HS batches overlap. The `2026-06-05` batch uses `country='USA'` + spelled-out states; the `2026-06-06` batch uses `country='United States'` + abbreviations. Known dupes: Ariana Akey (Mountain Vista), Samaya Taylor-Jenkins (Hamilton).

```sql
SELECT lower(first_name) f, lower(last_name) l, count(*), array_agg(id) ids, array_agg(created_at::date) created
FROM players
GROUP BY 1,2 HAVING count(*) > 1;
```

**Step 2: Delete the older/less-normalized copy, keep the `2026-06-06` version**

For each dup, keep the row with `country='United States'` (abbreviated state) and delete the other:

```sql
DELETE FROM players a
USING players b
WHERE lower(a.first_name)=lower(b.first_name)
  AND lower(a.last_name)=lower(b.last_name)
  AND a.created_at::date='2026-06-05' AND b.created_at::date='2026-06-06';
```

**Step 3: Verify no dups remain** — re-run Step 1 query, expect 0 rows.

**Step 4: Commit**

```bash
git commit --allow-empty -m "chore(db): de-duplicate high-school player profiles"
```

### Task 1.3: Normalize country and state values

**Step 1: Standardize country + convert spelled-out states to 2-letter codes**

```sql
UPDATE players SET country='United States' WHERE country IN ('USA','US','United States of America');
-- normalize the spelled-out states from the 06-05 batch
UPDATE players SET state = CASE state
  WHEN 'Arizona' THEN 'AZ' WHEN 'California' THEN 'CA' WHEN 'Colorado' THEN 'CO'
  WHEN 'Florida' THEN 'FL' WHEN 'Georgia' THEN 'GA' WHEN 'Alabama' THEN 'AL'
  WHEN 'Nevada' THEN 'NV' WHEN 'Texas' THEN 'TX' WHEN 'New York' THEN 'NY'
  WHEN 'North Carolina' THEN 'NC' WHEN 'Pennsylvania' THEN 'PA'
  ELSE state END
WHERE length(state) > 2;
```

**Step 2: Verify**

```sql
SELECT DISTINCT country FROM players ORDER BY 1;                       -- expect: United States, Italy, (others)
SELECT DISTINCT state FROM players WHERE length(state) > 2;            -- expect: 0 rows
```

**Step 3: Commit**

```bash
git commit --allow-empty -m "chore(db): normalize player country/state values"
```

---

## PHASE 2 — Refresh USA national rosters to 2025/2026 baseline

**Goal:** Confirm the USA Men's & Women's national team players reflect actual 2025/2026 rosters, tag every national-team player with a `roster_year`, and remove anyone not on a 2025/2026 roster.

### Task 2.1: Pull the authoritative current rosters

**Step 1: Fetch the official rosters**

Use the firecrawl-scrape skill (or WebFetch) on:
- `https://usafootball.com/national-team/womens-national-team-2026`
- USA Football men's national team page (find via firecrawl-map on `usafootball.com/national-team`)

Save the extracted name/position/hometown lists to a scratch note. **Do not invent players** — only seed names confirmed on the official page.

**Step 2: Diff against the DB**

```sql
SELECT first_name, last_name, position, school_or_team
FROM players
WHERE level='national' AND country='United States'
ORDER BY school_or_team, last_name;
```
Compare to the scraped rosters. Build three lists: (a) keep, (b) add (on official roster, missing from DB), (c) remove (in DB, not on any 2025/2026 official roster).

### Task 2.2: Tag national players with roster_year

**Step 1: Add `roster_year` into the `stats` JSONB for every national player**

```sql
UPDATE players
SET stats = jsonb_set(coalesce(stats,'{}'::jsonb), '{roster_year}', '"2025"', true)
WHERE level='national' AND country='United States'
  AND NOT (stats ? 'roster_year');
```

**Step 2: Verify** — `SELECT count(*) FROM players WHERE level='national' AND stats ? 'roster_year';`

### Task 2.3: Apply add/remove list

**Step 1:** Insert any confirmed-missing players (follow the existing INSERT shape — `first_name,last_name,position,level,school_or_team,state,country,gender,is_verified,stats`). Set `stats.roster_year` and `stats.source='usafootball.com'`.

**Step 2:** Remove any DB national player NOT on a 2025/2026 official roster (delete by explicit `id` list only — never bulk-delete national rows).

**Step 3: Verify + commit**

```sql
SELECT school_or_team, count(*) FROM players WHERE level='national' GROUP BY 1 ORDER BY 1;
```
```bash
git commit --allow-empty -m "data(db): align USA national rosters to 2025/2026 baseline"
```

---

## PHASE 3 — Olympic & Junior/Youth national teams

**Goal:** Stand up roster scaffolding for the upcoming Olympics (flag football debuts at **LA 2028**) and add Junior/Youth national team rosters where published.

> Flag football is an Olympic sport for the first time at LA 2028; official Olympic rosters are **not yet named**. This phase creates the *team designation* and seeds junior/youth rosters that already exist, so the structure is ready.

### Task 3.1: Establish a team-designation convention

**Step 1:** Decide on `stats.team_designation` values: `national_senior`, `olympic_2028`, `national_junior`, `national_youth`. Backfill existing national players:

```sql
UPDATE players
SET stats = jsonb_set(coalesce(stats,'{}'::jsonb),'{team_designation}','"national_senior"',true)
WHERE level='national' AND NOT (stats ? 'team_designation');
```

### Task 3.2: Seed Olympic placeholder team pages (no fake athletes)

**Step 1:** In `src/lib/world-rankings.ts`, add an "Olympic — LA 2028" informational entry (qualification path, host nation, debut note). **No fabricated rosters** — show "Roster TBD" until USA Football names the squad.

**Step 2:** Verify `npm run build` succeeds; commit.

### Task 3.3: Seed Junior/Youth rosters if available

**Step 1:** firecrawl-scrape USA Football junior/youth national team pages. If rosters are published, INSERT players with `level='national'`, `stats.team_designation='national_junior'` (or youth), `stats.roster_year`, `stats.source`. If not published, record "no roster available" in the plan notes and skip — do not fabricate.

**Step 2: Commit**

```bash
git commit --allow-empty -m "data(db): add Olympic team scaffolding + junior/youth rosters"
```

---

## PHASE 4 — Refresh Events from USA Football (GMTM)

**Goal:** Populate the Events page with current/upcoming USA Football Talent ID Camps and Digital Combines.

### Task 4.1: Confirm the events schema

**Step 1:**
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name='events' ORDER BY ordinal_position;
```
Note required columns (title, date(s), location, type, url, etc.).

### Task 4.2: Scrape + insert upcoming events

**Step 1:** firecrawl-scrape `https://gmtm.com/organizations/249002/usa-football/home`. Extract only events dated **on/after today (2026-06-06)**.

**Step 2:** INSERT each as an event with a `source_url` back to GMTM and a `type` of `Talent ID Camp` or `Digital Combine`. Skip past events.

**Step 3: Verify** the Events page renders them:
- preview_start, then preview_snapshot of `/events` — confirm the new events appear and dates are future.

**Step 4: Commit**

```bash
git commit -m "data(db): add upcoming USA Football Talent ID Camps + Digital Combines"
```

---

## PHASE 5 — Trim the top navigation

**Goal:** Reduce the 12-item top nav to the highest-value pages; demote the rest to the footer + in-page links.

**Files:**
- Modify: `src/components/layout/Nav.tsx:9-22`

**Step 1: Reduce `navLinks` to the confirmed core set** (recommended default below):

```tsx
const navLinks = [
  { label: "Players", href: "/players" },
  { label: "Teams", href: "/teams" },
  { label: "Podcast", href: "/podcast" },   // renamed in Phase 8
  { label: "Events", href: "/events" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
];
```
Removed from top nav (now footer-only): Coaches, Community, Scouts, Media, Merch, Contact. Keep the "Submit Profile" CTA button.

**Step 2: Build to confirm no broken imports** — `npm run build` (expect success).

**Step 3: Verify in preview** — preview_snapshot of `/`; confirm 6 desktop links + mobile menu shows the same 6.

**Step 4: Commit**

```bash
git add src/components/layout/Nav.tsx
git commit -m "feat(nav): trim top nav to 6 high-traffic pages"
```

---

## PHASE 6 — Rebalance the footer into even columns

**Goal:** Reorganize the sitemap links into balanced, evenly spaced columns, and ensure every demoted nav item is reachable here.

**Files:**
- Modify: `src/components/layout/Footer.tsx`

**Step 1: Restructure into 4 even content columns** beside the brand block. Group by theme so each column has a similar count, e.g.:
- **Watch & Read:** Podcast, Media, Blog, RSS Feed, Network
- **Database:** Players, Teams, Rankings, Athlete of the Week, Top 10 Plays
- **Compete:** Events, Results, Find a League, Recruit, Submit Event
- **Connect:** Coaches, Scouts, Community, Merch, About, Contact

Convert the current 2-up brand + 2 link columns into `md:grid-cols-5` (brand spans 1, four link columns each span 1) or a `md:grid-cols-6` with brand spanning 2 — pick whichever keeps columns visually even. Keep heading style (`font-display uppercase tracking-widest text-brand-yellow`) and the existing external-link handling pattern.

**Step 2: Verify** — preview_snapshot footer at desktop; preview_resize to mobile to confirm columns stack cleanly. Check every link resolves (no 404) with preview_click spot-checks on 2–3.

**Step 3: Commit**

```bash
git add src/components/layout/Footer.tsx
git commit -m "feat(footer): rebalance sitemap into even themed columns"
```

---

## PHASE 7 — Clean up the About page

**Goal:** Remove the duplicate set of host bios and use Ambra-supplied photos with the second (HostCard) bio set.

**Files:**
- Modify: `src/app/about/page.tsx`
- Modify/Remove: `src/components/hosts/HostsHero.tsx`
- Add images: `public/` (Ambra-supplied)

> **Owner input needed:** the actual photo files from Ambra. Until provided, wire the new `<Image src>` paths and note the filenames required.

**Step 1:** Eliminate the duplication. The page currently renders bios twice — once in `HostsHero` (scrolling bio columns, lines 47–69) and once in the `HostCard` grid (`page.tsx:72-93`). Keep the `HostCard` bios (the second set). Edit `HostsHero` to be a **photo-only hero** (drop `AMBRA_BIO`/`TIKA_BIO`/`TOGETHER` text block), OR replace the hero image with the new twin photoshoot and keep only the headline.

**Step 2:** Drop Ambra-supplied images into `public/` and update `src/app/about/page.tsx` `HostCard` `image` props (`/ambra.jpg`, `/tika.jpg`) and the hero `src` (`/hosts-hero.jpg`) to the new filenames.

**Step 3: Verify** — preview_snapshot `/about`; confirm exactly one bio per host, photos load, no console errors (preview_console_logs).

**Step 4: Commit**

```bash
git add src/app/about/page.tsx src/components/hosts/HostsHero.tsx public/
git commit -m "feat(about): remove duplicate bios, use Ambra-supplied photos"
```

---

## PHASE 8 — Rename Episodes → Podcast + reorganize + audio widget

**Goal:** Rename the route for SEO, organize episodes by topic/guest type (latest pinned on top, with a placeholder "Top 2 Most Watched" rail), and embed an audio streaming widget so users can listen on-site (hot97-style).

**Files:**
- Rename dir: `src/app/episodes/` → `src/app/podcast/` (incl. `episodes/[id]` → `podcast/[id]`)
- Modify: `src/app/sitemap.ts`, `src/components/layout/Nav.tsx`, `src/components/layout/Footer.tsx`
- Add redirect: `next.config.ts` (301 `/episodes` → `/podcast`)
- Modify: `src/lib/youtube.ts` (topic tags already exist via `deriveTopicTags`)
- Add: `src/components/episodes/PodcastAudioPlayer.tsx`

### Task 8.1: Move the route

**Step 1:** `git mv src/app/episodes src/app/podcast` and `git mv` the `[id]` subroute. Update internal hrefs (`/episodes` → `/podcast`) across the codebase:
```bash
grep -rn "/episodes" src | grep -v node_modules
```
Update each hit (Nav, Footer, SubscribePanel, any homepage link, JSON-LD URLs, metadata `path`).

**Step 2:** Update page metadata title/description to lead with "Podcast" for SEO. Update `src/app/sitemap.ts` entry.

**Step 3: Add a permanent redirect** in `next.config.ts`:
```ts
async redirects() {
  return [{ source: "/episodes", destination: "/podcast", permanent: true },
          { source: "/episodes/:id", destination: "/podcast/:id", permanent: true }];
}
```

**Step 4: Verify** `npm run build`; preview `/episodes` 301s to `/podcast`. Commit.

### Task 8.2: Organize by topic / guest type

**Step 1:** On the podcast page, keep the **Latest Episode** hero (existing), add a **"Top 2 Most Watched"** rail directly under it (placeholder: hardcode 2 episode IDs the owner will supply; mark `TODO(owner)` for true view-count sorting once YouTube stats are wired). Then render the existing `EpisodeSearch` grid, but group/filter by the `deriveTopicTags` categories (Recruiting, Coaching, International, Women's Flag, Performance, Business, Youth Flag) — the tag filter bar already exists; ensure a "guest type" grouping reads well.

**Step 2: Verify** preview_snapshot `/podcast` — latest pinned, top-2 rail, topic filters work (preview_click a tag, snapshot result). Commit.

### Task 8.3: Embedded audio streaming widget

**Step 1:** Create `src/components/episodes/PodcastAudioPlayer.tsx` — a sticky/inline audio player embedding the show's audio feed (Spotify episode embed iframe or an `<audio>` element pointing at the podcast RSS enclosure). Default to a **Spotify show embed** (`https://open.spotify.com/embed/show/<id>`); leave the show ID as a `TODO(owner)` constant.

**Step 2:** Mount it on `/podcast` (and optionally a slim version on `/about` SubscribePanel). Lazy-load to protect LCP (mirror the `YouTubeFacade` click-to-load pattern).

**Step 3: Verify** preview_snapshot shows the player; preview_console_logs clean. Commit:
```bash
git commit -m "feat(podcast): rename from Episodes, topic grouping, embedded audio player"
```

---

## PHASE 9 — flagsonly.com player import

**Goal:** Import the flagsonly.com player index into our `players` table as reference profiles, deduped and clearly sourced.

**Files:**
- Add: `scripts/import-flagsonly.ts` (one-off Node/tsx script using the Supabase service-role key from `.env.local`)

### Task 9.1: Extract the index

**Step 1:** Use firecrawl-crawl / firecrawl-agent on `https://www.flagsonly.com/player-index` to extract structured rows (name, position, school/team, state, grad year, level). Save to `scripts/data/flagsonly-players.json`.

### Task 9.2: Build the importer

**Step 1: Write a dedup-aware import script** that, for each row: normalizes country/state (reuse Phase 1 conventions), skips if a case-insensitive `first_name+last_name+school_or_team` match already exists, otherwise inserts with `is_verified=false`, `is_claimed=false`, `stats.source='flagsonly'`, `stats.imported_at`.

**Step 2: Dry-run** the script with an `--dry-run` flag that only prints insert/skip counts. Expected: sane add count, dupes skipped.

**Step 3: Run for real**, then verify:
```sql
SELECT count(*) FROM players WHERE stats->>'source'='flagsonly';
SELECT count(*) AS total FROM players;
```

**Step 4: Commit**

```bash
git add scripts/import-flagsonly.ts scripts/data/flagsonly-players.json
git commit -m "feat(data): import flagsonly.com player index as sourced reference profiles"
```

---

## PHASE 10 — Brand / Database / Rankings explainer (flagsonly inspiration)

**Goal:** A page (+ blog post) that explains the brand, the player database, and the rankings methodology/algorithm — the credibility surface flagsonly has.

**Files:**
- Add: `src/app/rankings/about/page.tsx` (or `src/app/how-rankings-work/page.tsx`)
- Modify: `src/lib/static-posts.ts` (companion blog post)
- Modify: `src/app/rankings/page.tsx` (link to explainer)

**Step 1:** Build the explainer page: what Talkin Flag is, how the player database is sourced (national rosters, flagsonly import, submissions, verification), and the TF Rank methodology — reuse the agreed weighting (external 0.2 / measurables 0.3 / assessment 0.5). Mark the precise 100-pt rubric `TODO(owner: Ambra/Tika)` per the existing roadmap (Phase A is owner-blocked).

**Step 2:** Add a matching `static-posts.ts` entry (brand/algorithm story) with internal links to `/rankings`, `/players`, `/teams`.

**Step 3:** Add a sitemap entry + a prominent link from `/rankings`.

**Step 4: Verify** build + preview_snapshot the new page; commit:
```bash
git commit -m "feat(content): add brand + rankings methodology explainer page and blog post"
```

---

## PHASE 11 — Scores & Results + College page upgrades

**Goal:** Strengthen `/results` to surface more upcoming events/games (flagsonly Scores & Results inspiration) and improve the College experience (flagsonly College page inspiration).

**Files:**
- Modify: `src/app/results/page.tsx`
- Modify: `src/app/rankings/page.tsx` and/or `src/components/rankings/TeamsHub.tsx` (College tab)

### Task 11.1: Results — add an "Upcoming" view

**Step 1:** Add an **Upcoming Events/Games** section above past results, sourced from the `events` table (future-dated, incl. the Phase 4 USA Football camps/combines). Keep the existing filterable archive below. Preserve the year/level filter UX noted in the roadmap.

**Step 2: Verify** preview_snapshot `/results`; upcoming section lists future events, archive still filters. Commit.

### Task 11.2: College page optimization

**Step 1:** Enhance the College rankings tab — add the growing list of girls-flag D1 offers/commits (the data already lives on player profiles, e.g., Ariana Akey → Nebraska, Aribella Spandiary → Purdue NW, Makena Cook → first P4 offer). Surface a "College Commits" panel + clearer division filtering, mirroring flagsonly's college layout.

**Step 2: Verify** preview_snapshot the College tab; commit:
```bash
git commit -m "feat(results+college): add upcoming events view and college commits panel"
```

---

## Wrap-up

**Step W.1 — Full build + smoke test**
```bash
npm run build   # expect: clean
```
preview_start and snapshot the changed routes: `/`, `/about`, `/podcast`, `/players`, `/teams`, `/events`, `/results`, `/rankings`, footer.

**Step W.2 — Drop the backup tables once verified**
```sql
DROP TABLE IF EXISTS _backup_players_20260606;
DROP TABLE IF EXISTS _backup_events_20260606;
```

**Step W.3 — Update memory + CLAUDE.md**
- Update `project_talkinflag.md` DB section (player counts, roster_year/team_designation/source conventions, flagsonly source tag, /podcast route).
- Update `CLAUDE.md` Open Items + Key Files (Episodes → Podcast).

**Step W.4 — Finish the branch**
REQUIRED SUB-SKILL: superpowers:finishing-a-development-branch (merge / PR / cleanup). Deploy to Vercel after merge.

---

## Owner action checklist (collect before/during execution)
- [ ] Confirm the 6 top-nav pages (Phase 5).
- [ ] Ambra's host photos + final confirmation the HostCard bios are the keepers (Phase 7).
- [ ] Spotify **show ID** for the audio widget; the 2 "most watched" episode IDs (Phase 8).
- [ ] OK to import flagsonly.com profiles as unclaimed/unverified reference data (Phase 3/9).
- [ ] The 100-pt TF Rank rubric weights (Phase 10 — currently TODO).
