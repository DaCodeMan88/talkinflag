# Talkin Flag — Claude Code Context

**Project root:** /Users/danielharris/Desktop/Flag/talkinflag/
**Live site:** https://talkinflag.vercel.app
**Stack:** Next.js 15 App Router · TypeScript · Tailwind · Supabase · Resend · Vercel

---

## Active Roadmap

**To start the next build session, say:**
> "Read CLAUDE.md and let's continue from the open items."

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

### Build Queue
1. **Merge accuracy-ia-overhaul branch** — build is clean, ready for PR + Vercel deploy
2. **Drop backup tables after merge** — `DROP TABLE _backup_players_20260606; DROP TABLE _backup_events_20260606;`
3. **About page photos from Ambra** — drop in `public/` as `/hosts-hero.jpg`, `/ambra.jpg`, `/tika.jpg`
4. **Podcast audio widget** — needs Spotify show ID (owner action) for `/podcast` embedded player
5. **Episode-to-Blog Conversion** — long-form articles from podcast episodes. Start with Vanita Krouch, Katherine Sowers.
6. **TF Rankings Algorithm (Phase A)** — needs Ambra & Tika to define the 100-pt rubric weights.
7. **More images for Gallery** — drop in `public/gallery/`, add to array in `src/app/media/page.tsx`

### Owner Actions Still Blocking Features
| Item | What It Unlocks | Action |
|------|----------------|--------|
| Spotify show ID | Podcast audio widget | Send show ID → add to PodcastAudioPlayer |
| Ambra's photos | About page | Drop `/hosts-hero.jpg`, `/ambra.jpg`, `/tika.jpg` in `public/` |
| 100-pt TF Rank rubric | TF Rankings Algorithm live scores | Define with Ambra & Tika |
| `RESEND_API_KEY` | Contact form, welcome email, weekly digest | Vercel → Settings → Env Vars |
| `YOUTUBE_API_KEY` | Live episode fetching | Vercel |
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
