# Talkin Flag — Traffic Growth Roadmap
_Created: 2026-06-05_

## Scope
Features and content strategies to drive new and returning traffic. Email digest excluded (owner action pending). Episode-to-blog conversion tracked in Open Items below, not built here.

---

## Phase A — Talkin Flag Player Rankings Algorithm
_Goal: Replace static/external rankings with a proprietary "Talkin Flag Rank" that becomes a destination people check and reference._

### Background
Current rankings on `/players` use `ranking_national` pulled from external sources (MaxPreps, IFAF). The goal is a proprietary scoring system that combines:
1. **External rank signals** — existing `ranking_national` value as a baseline input
2. **Platform stats** — verified measurables (40-yard, vertical, height, weight) stored in `stats` JSONB
3. **Talkin Flag Assessment Score** — a 100-point rubric scored by Ambra, Tika, and designated evaluators, where they assign weighted importance to tangible qualities from their expert perspective

The output is a new `ranking_tf` column on the players table — the "Talkin Flag Rank" — displayed on player cards, profiles, and a dedicated leaderboard.

### The 100-Point Assessment Rubric
Ambra, Tika, and evaluators complete a scoring form per player. Each category has a max point value they define. Example structure (values TBD by evaluators):

| Category | Max Points | Notes |
|----------|-----------|-------|
| Athletic measurables (40-yd, vertical) | ? | Verified stats weighted higher |
| Film/highlight quality | ? | Evaluator scores submitted highlight |
| Tournament/competition level | ? | IFAF, national team, etc. |
| Position-specific skills | ? | Evaluator judgment |
| Program/team quality | ? | School or national team prestige |
| Coachability / intangibles | ? | Evaluator judgment |
| **Total** | **100** | |

The evaluator completes this form per player in an `/admin/rankings` interface. Scores are stored in a new `player_assessments` table. The algorithm averages scores across evaluators.

### Algorithm Formula (draft)
```
tf_score = (
  external_rank_score * W1 +    // normalized 0–100 from ranking_national
  measurables_score * W2 +      // derived from verified stats vs position benchmarks
  assessment_avg * W3            // average of all submitted 100-pt assessments
)
```
Weights (W1, W2, W3) are configurable by admin. Start at 0.2 / 0.3 / 0.5.

### DB Changes
```sql
-- New column on players
ALTER TABLE players ADD COLUMN ranking_tf integer;

-- New table for assessment scores
CREATE TABLE player_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  evaluator_id uuid NOT NULL REFERENCES auth.users(id),
  scores jsonb NOT NULL,          -- { "measurables": 22, "film": 18, ... }
  total integer NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (player_id, evaluator_id)
);
```

### Tasks
1. **DB migration** — add `ranking_tf` to players, create `player_assessments` table
2. **`/admin/rankings` assessment form** — evaluator selects a player, fills in score per category, submits. Shows existing scores for that player if already assessed.
3. **Ranking compute function** — server action or API route that recalculates `ranking_tf` for all players (or a single player) based on formula above. Callable from admin.
4. **Display** — show "TF Rank #N" badge on player cards and profile pages (alongside or replacing `ranking_national` display). Add a "Talkin Flag Rankings" view to `/players` page (toggle between external rank and TF rank).
5. **Rankings leaderboard** — `/rankings` or tab on `/players` — top 25 by TF rank, filterable by position/gender/level. The canonical Talkin Flag power rankings page.

---

## Phase B — Athlete Profile of the Week
_Goal: Weekly featured player drives social sharing from that player's network, bringing new audiences to the site each week._

### How It Works
- Admin selects one verified player as "Profile of the Week" via `/admin`
- Featured prominently on homepage (above the fold or as a dedicated section)
- Dedicated share card optimized for Instagram/X — player photo, TF rank, key stats, "Featured on Talkin Flag"
- Auto-expires after 7 days (new selection needed)

### DB Changes
```sql
CREATE TABLE featured_athlete (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id),
  featured_from timestamptz NOT NULL DEFAULT now(),
  featured_until timestamptz NOT NULL,  -- featured_from + 7 days
  message text  -- optional blurb from Ambra/Tika
);
```

### Tasks
1. **DB migration** — create `featured_athlete` table
2. **`/admin/featured`** — simple form: search players, select one, set message, submit. Shows current featured player with time remaining.
3. **Homepage featured section** — if an active `featured_athlete` row exists, show a hero-style card between the stats bar and episode grid. Player photo, name, position, TF rank, message, link to profile.
4. **Shareable image** — OG image for the featured athlete that platforms pull when the profile URL is shared. Large photo, "Athlete Profile of the Week · Talkin Flag" watermark.
5. **History page** — `/athletes/featured` — archive of past featured players. SEO value, social proof.

---

## Phase C — Top 10 Plays of the Week
_Goal: Player highlight submissions create a content loop — players submit, Talkin Flag curates, featured players share, their networks discover the site._

### Submission Flow
1. Player (logged in) submits a highlight via dashboard: YouTube URL or direct video URL, brief description, play type (TD catch, rush, interception, etc.)
2. Submission stored in `highlight_submissions` table with `status = 'pending'`
3. Admin reviews at `/admin/highlights` — approve, reject, or mark as "Top 10 candidate"
4. Each week, admin selects up to 10 approved highlights and publishes the Top 10
5. Published as a dedicated page `/plays/week/[year-week]` and featured on homepage

### DB Changes
```sql
CREATE TABLE highlight_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES players(id) ON DELETE SET NULL,
  submitted_by uuid NOT NULL REFERENCES auth.users(id),
  video_url text NOT NULL,
  description text,
  play_type text,  -- 'touchdown' | 'interception' | 'rush' | 'one-handed catch' | 'other'
  status text NOT NULL DEFAULT 'pending',  -- pending | approved | rejected | top10
  week_featured text,  -- ISO week string e.g. '2026-W23'
  rank_in_week integer,  -- 1–10
  created_at timestamptz DEFAULT now()
);
```

### Tasks
1. **DB migration** — create `highlight_submissions`
2. **Submission form on dashboard** — "Submit a Highlight" card. YouTube URL input, description, play type dropdown.
3. **`/admin/highlights`** — list of pending submissions with video preview (YouTube embed), approve/reject/star buttons, "Publish Top 10" workflow for selecting 10 and assigning week + rank.
4. **`/plays/week/[year-week]`** — Top 10 page. Numbered grid of 10 embedded videos with player name, position, description. Shareable.
5. **Homepage widget** — "Top 10 Plays This Week" teaser card when a current week's Top 10 is published.
6. **Archive** — `/plays` — index of all past Top 10 weeks. Each week is a link.

---

## Phase D — Profile Embed Widget + Share Card Fix
_Goal: Players can embed their profile card anywhere (Hudl, personal site, recruiting email). Fix the share card to remove useless internal option._

### Share Card Fix
The current `ShareCardModal` has an internal share option that has no destination. Remove it. Keep:
- **Download as image** (existing)
- **Share to X/Twitter** (existing)
- **Share to LinkedIn** (existing)
- **Copy profile link** (existing)
- **Add: Copy embed code** (new)

### Embed Widget
A player profile card embeddable on any external site. Output is an `<iframe>` snippet pointing to `/players/[id]/embed`.

**`/players/[id]/embed` page:**
- Stripped-down version of the profile card (no nav, no footer)
- Shows: photo, name, position, level, school/team, TF rank, key verified stats
- Branded "Powered by Talkin Flag" link at bottom (backlink)
- Designed to fit in a ~400×300px iframe

### Tasks
1. **`/players/[id]/embed`** — new route, bare layout (no Nav/Footer), profile card only
2. **`/players/[id]/embed.tsx`** — component: photo, name, position, level, top 3 stats, TF rank if exists, Talkin Flag branding link
3. **Share card fix** — remove internal share option from `ShareCardModal.tsx`. Add "Embed" button that copies `<iframe src="https://talkinflag.com/players/[id]/embed" ...>` snippet to clipboard.
4. **Embed preview on profile page** — small "Embed this profile" link at bottom of player profile that opens a modal with the embed code.

---

## Phase E — Tournament Results
_Goal: The events page becomes a living record of results, not just a calendar. Creates searchable historical data and return traffic._

### UX Principle
Results must be organized to stay manageable as data grows. Key decisions:
- Results are attached to existing events (not standalone)
- Results page is separate from events calendar (don't clutter the upcoming events view)
- Filterable by year, level, gender — so "2024 IFAF World Championship" is findable in 3 years
- Each event result has a permalink for social sharing

### DB Changes
```sql
CREATE TABLE event_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  division text,          -- 'Men's Open' | 'Women's Open' | 'Youth U12' etc.
  place integer,          -- 1st, 2nd, 3rd...
  team_name text NOT NULL,
  score text,             -- e.g. '53-21' for a final
  notes text,
  created_at timestamptz DEFAULT now()
);
```

### Tasks
1. **DB migration** — create `event_results`
2. **`/admin/events/[id]/results`** — admin form to add results rows per division. Add place, team, score, notes.
3. **Event detail page `/events/[id]`** — if results exist, show them in a "Results" section below event details. If event is upcoming, this section is hidden.
4. **`/results`** — standalone results index. Filter by year and level. Cards link to event detail pages. Clean pagination.
5. **Homepage teaser** — "Latest Results" section showing the most recent completed event result.

---

## Phase F — League Finder Partnership + Discovery
_Goal: Leverage existing Flag Football League Finder partnership to drive referral traffic both ways._

### What to Build
- **`/find-a-league`** — a page that embeds or links to the partner's finder, with Talkin Flag context/branding around it. Establishes Talkin Flag as the hub even for things we don't own.
- **Partner link exchange** — ensure talkinflag.com is listed prominently on their site as a resource. Coordinate a blog post: "How to Find a Flag Football League Near You" (SEO) that links to the finder and vice versa.
- **Events cross-listing** — explore whether their events/leagues can appear in the Talkin Flag events feed (API or manual import).

### Tasks
1. **`/find-a-league` page** — simple page with partner embed or search link, context copy, link to submit a league if they have that option
2. **Blog post** — "How to Find a Flag Football League Near You" — well-written, SEO-targeted, links to the partner finder and to Talkin Flag's `/events` page. Add to static posts.
3. **Footer link** — add "Find a League" to footer Platform column

---

## Phase G — Player Comparison Tool
_Goal: Coaches use it for recruiting decisions. Players share it on social. Both drive traffic._

### How It Works
- URL: `/players/compare?a=[id]&b=[id]`
- Side-by-side two player profiles: photo, name, position, level, TF rank, all verified stats
- Shareable URL — copy button
- Accessible from player profile page: "Compare" button that opens a search to pick a second player

### Tasks
1. **`/players/compare`** — client page, reads `?a=` and `?b=` from URL, fetches both players server-side
2. **Comparison layout** — two-column. Highlight the "winner" of each stat category in yellow. Show TF rank diff.
3. **"Compare" button on player profile** — opens a search modal to pick a second player, then redirects to `/players/compare?a=[current]&b=[selected]`
4. **Share button** — copies `/players/compare?a=...&b=...` URL to clipboard

---

## Open Items (Not in this roadmap — come back later)

### Episode-to-Blog Conversion
_When working on the blog, convert podcast episodes to long-form Rolling Stone-style interview articles:_
- Written narrative format (not raw transcript) — reads like a great magazine interview
- YouTube video embedded at bottom
- Internal links to related blog posts and player/coach profiles
- Each article is a new SEO-indexed page with unique content
- More page surface area = more ad/monetization space
- Start with the highest-profile guests (Vanita Krouch, Katherine Sowers, etc.)

### Top 10 Plays — Revisit Process
_Built and shipped in Phase C, but the submission/curation workflow needs a second look:_
- Is the player self-submission model the right flow, or should Ambra/Tika source plays themselves?
- Consider adding email notification to admin when a new highlight is submitted
- Consider letting submitters know when their play makes the Top 10

### Email Digest
- Already built. Needs `RESEND_API_KEY` in Vercel env vars to activate.
- Once live, add a newsletter signup CTA to the homepage and blog posts.

---

## Session Kickoff Prompt

> "Read docs/plans/2026-06-05-traffic-growth-roadmap.md and start with Phase A. Use superpowers:executing-plans."
