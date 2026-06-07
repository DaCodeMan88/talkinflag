# Talkin Flag — Claude Code Context

**Project root:** /Users/danielharris/Desktop/Flag/talkinflag/
**Live site:** https://talkinflag.vercel.app
**Stack:** Next.js 15 App Router · TypeScript · Tailwind · Supabase · Resend · Vercel

---

## Active Roadmap

**🎯 Master plan (everything below is now consolidated here):**
`docs/plans/2026-06-06-community-rankings-platform.md` — the Community Rankings Platform: highlight-clip blogs + Shorts (Phase A), IQ quiz funnel (B), weighted Coaches/Experts/Hosts polls (C), the TF ranking algorithm (D), fundamentals course (E), career-update re-engagement (F), i18n + Mexico depth (G), and the full tabled/parked backlog + owner actions (H).

**To start the next build session, say:**
> "Read CLAUDE.md and docs/plans/2026-06-06-community-rankings-platform.md, resolve the Decisions Needed section with me, then execute Phase A."

> ⚠️ Do Phase H3 (drop `_backup_*` tables) before any new Phase B migrations. The build-queue/owner-action lists below are retained for reference but are all folded into the master plan.

---

## Completed Work — All Shipped ✅

### Traffic Growth Roadmap (docs/plans/2026-06-05-traffic-growth-roadmap.md)
| Phase | Feature | Status |
|-------|---------|--------|
| A | TF Rankings Algorithm | Deferred — needs 100-pt rubric from Ambra & Tika |
| B | Athlete Profile of the Week | ✅ Live — `/admin/featured`, homepage hero section, `/athletes/featured` |
| C | Top 10 Plays of the Week | ✅ Live — player submission, `/admin/highlights`, `/plays/week/[week]`, `/plays` |
| D | Profile Embed Widget + Share Card | ✅ Live — `/players/[id]/embed`, embed code in share modal |
| E | Tournament Results | ✅ Live — `event_results` table, `/admin/events/[id]/results`, `/results` |
| F | League Finder | ✅ Live — `/find-a-league` |
| G | Player Comparison Tool | ✅ Live — `/players/compare`, Compare button on profiles |

### Accuracy & IA Overhaul (docs/plans/2026-06-06-accuracy-and-ia-overhaul.md) ✅ Branch: accuracy-ia-overhaul
| Phase | Work | Status |
|-------|------|--------|
| 1 | Remove 15 fake demo players, dedup HS profiles (Akey/Taylor-Jenkins), normalize country/state | ✅ Done |
| 2+3 | Tag all 49 national players with roster_year='2024' + team_designation='national_senior'; Olympic 2028 scaffolding in world-rankings.ts | ✅ Done |
| 4 | Events audit — 8 solid future events already in DB through LA 2028 | ✅ Done |
| 5 | Nav trimmed to 6 links: Players · Teams · Podcast · Events · Blog · About | ✅ Done |
| 6 | Footer rebalanced: 5 columns (brand + Watch & Read, Database, Compete, Connect) | ✅ Done |
| 7 | About page: HostsHero is now photo-only hero; HostCard grid is sole bio source (no duplicates) | ✅ Done |
| 8 | `/episodes` → `/podcast` rename — all hrefs, metadata, JSON-LD, OG image, sitemap, 301 redirects in next.config.ts | ✅ Done |
| 9 | flagsonly.com import: 284 new players from Playwright scrape; dedup-aware script in scripts/import-flagsonly.ts | ✅ Done |
| 10 | Rankings explainer at `/how-rankings-work`; companion blog post; footer link | ✅ Done |
| 11 | Results page: Upcoming Events section above archive; Teams page: College Commits panel (Akey/Nebraska, Spandiary/Purdue NW) | ✅ Done |

### Episode-to-Blog + Player SEO (docs/plans/2026-06-06-episode-blog-player-seo.md) ✅ Branch: episode-blog-seo
| Phase | Work | Status |
|-------|------|--------|
| 1 | `StaticPost` gains `youtubeVideoId`/`guestName`/`guestRole`; blog template embeds `YouTubeFacade` (guarded against `TODO_OWNER`) + guest byline | ✅ Done |
| 2 | 5 interview articles in `static-posts.ts` — Sowers, Clark-Robinson, Krouch, Doucette, Flores (facts web-verified, no invented quotes) | ✅ Done |
| 3 | Player `generateMetadata` richer title/description + fuller `Person` JSON-LD (sport/affiliation/memberOf/knowsAbout) across all 374 profiles | ✅ Done |
| — | **Owner action:** supply real YouTube video IDs to replace `TODO_OWNER` in the 5 interview posts once `YOUTUBE_API_KEY` is live | ⏳ Pending |

### Media / Gallery
- `/media` page with photo gallery (masonry grid) + 3×3 Instagram embed grid
- To add photos: drop files in `public/gallery/` and add entry in `src/app/media/page.tsx`
- To swap IG posts: edit the `INSTAGRAM_POSTS` array in that file

### Database — Current State
- **374 total players** · 41 HS · 206 college · 127 national
- 284 imported from flagsonly.com (tagged `stats.source='flagsonly'`, `is_verified=false`, `is_claimed=false`)
- 49 national team players tagged `stats.roster_year='2024'` + `stats.team_designation='national_senior'`
- Backup tables `_backup_players_20260606` + `_backup_events_20260606` — drop after branch merge
- Player source conventions: `roster_year` (string year), `team_designation` (national_senior/national_junior/national_youth/olympic_2028), `source` (usafootball.com/flagsonly/submitted)

---

## Open Items — Next Session

### 🚨 Owner Actions — Needed Now
These 3 items are blocking final polish on the live site:

1. **Ambra's host photos** — Drop 3 files into `public/`:
   - `public/hosts-hero.jpg` — twin photoshoot hero image
   - `public/ambra.jpg` — Ambra solo headshot
   - `public/tika.jpg` — Tika solo headshot
   - Once dropped in, they will appear automatically on `/about`

2. **Spotify show ID** — Audio widget on `/podcast` is now **pre-built** (`SpotifyPlayer` component, wired into the page behind an env gate)
   - Find: open your Spotify for Podcasters dashboard → copy the Show ID from the URL
   - Activate: set `NEXT_PUBLIC_SPOTIFY_SHOW_ID` in Vercel (or send the ID and I'll hard-code it). Until set, the "Listen on Spotify" section stays hidden.

3. **Drop DB backup tables** — After confirming the live site looks correct, run these two SQL statements in the Supabase dashboard (SQL Editor):
   ```sql
   DROP TABLE IF EXISTS _backup_players_20260606;
   DROP TABLE IF EXISTS _backup_events_20260606;
   ```

### Build Queue
1. **TF Rankings Algorithm** — needs Ambra & Tika to define the 100-pt rubric weights.
2. **More images for Gallery** — drop in `public/gallery/`, add to array in `src/app/media/page.tsx`
3. **Profile claim outreach** — email flow for the 284 flagsonly-imported athletes to claim their profiles. Needs `RESEND_API_KEY`.
4. **Interview articles — Q&A upgrade** — the 5 interview posts in `static-posts.ts` are currently editorial paraphrase (no quotes). Once episode transcripts are available, upgrade them to direct Q&A / pull-quotes. **Do NOT invent quotes** — quotes must come from real transcripts.

> ✅ **Podcast audio widget** — pre-built (`src/components/episodes/SpotifyPlayer.tsx`, wired into `/podcast`). Now just an owner action (provide Spotify show ID — see above).

### Other Owner Actions
| Item | What It Unlocks | Action |
|------|----------------|--------|
| YouTube video IDs (×5) | Episode-to-Blog embeds | After YOUTUBE_API_KEY is live, replace `TODO_OWNER` in the 5 interview posts in `static-posts.ts` |
| Spotify show ID (or `NEXT_PUBLIC_SPOTIFY_SHOW_ID`) | Podcast audio widget on `/podcast` (already built) | Set env var in Vercel, or send the ID |
| Episode transcripts | Q&A upgrade of the 5 interview blog posts | Provide transcripts → real quotes get woven into the articles |
| Drop backup tables | Clean Supabase schema | Run `DROP TABLE IF EXISTS _backup_players_20260606; DROP TABLE IF EXISTS _backup_events_20260606;` in SQL Editor |
| 100-pt TF Rank rubric | TF Rankings Algorithm live scores | Define with Ambra & Tika |
| `RESEND_API_KEY` | Contact form, welcome email, profile claim outreach | Vercel → Settings → Env Vars |
| `YOUTUBE_API_KEY` | Live episode fetching + video IDs for blog | Vercel |
| `PRINTFUL_API_KEY` | Merch store (code done) | Vercel |
| Domain decision | talkinflag.com vs talkinflagshow.com | Supabase + Google Console |

---

## Key Files

| What | Where |
|------|-------|
| Nav | `src/components/layout/Nav.tsx` |
| Footer | `src/components/layout/Footer.tsx` |
| About / HostsHero | `src/app/about/page.tsx`, `src/components/hosts/HostsHero.tsx` |
| Podcast page | `src/app/podcast/page.tsx` (was episodes/) |
| Podcast episode page | `src/app/podcast/[id]/page.tsx` |
| Rankings explainer | `src/app/how-rankings-work/page.tsx` |
| Media/Gallery page | `src/app/media/page.tsx` |
| Player types | `src/types/player.ts` |
| Supabase server client | `src/lib/supabase/server.ts` |
| Supabase anon client | `src/lib/supabase/index.ts` |
| Static blog posts | `src/lib/static-posts.ts` |
| World rankings + Olympic + Commits | `src/lib/world-rankings.ts` |
| flagsonly import script | `scripts/import-flagsonly.ts` |
| flagsonly player data | `scripts/data/flagsonly-players.json` |
| Dev server config | `.claude/launch.json` (port 3000) |

---

## Brand

- Yellow: `#FDDD58` (Tailwind: `brand-yellow`)
- Black: `#000000` (Tailwind: `brand-black`)
- Fonts: Anton (`font-display`) + Inter (`font-body`)
- All headings: `font-display uppercase tracking-widest`

---

## Supabase Project

- **Project ID:** `wxeuybksowhncalrnttl`
- **URL:** `https://wxeuybksowhncalrnttl.supabase.co`
- **Anon key:** in `.env.local`
