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

### Media / Gallery
- `/media` page with photo gallery (masonry grid) + 3×3 Instagram embed grid
- **4 most popular** posts (20.4K + 8.5K + 2 more) + **5 most recent** = 9 embeds
- Official Instagram blockquote embeds — real previews, link to posts
- Nav + Footer links added
- To add photos: drop files in `public/gallery/` and add entry in `src/app/media/page.tsx`
- To swap IG posts: edit the `INSTAGRAM_POSTS` array in that file (use post/reel shortcode)

### Database — What's Been Added
- **Tournament Results:** 21+ championship events (2024–2026), all sanctioned US states + IFAF
- **Player Profiles:** 18 named players from championship games with stats
  - Ariana Akey (Mountain Vista, CO) — QB, Nebraska commit, 4,545 pass yds, 89 TDs
  - Taimane & Jade Skipps (North Pole, AK) — back-to-back Alaska state champs
  - Annie Keith (Robinson, FL) — 2025 2A Championship MVP, 42/48, 371 yds
  - Samaya Taylor-Jenkins (Hamilton, AZ) — NFL Showcase NFC MVP
  - Shaleah Moore (Campbell, HI) — Tournament MOP, 20 sacks, 5'1" 105 lbs
  - Aribella Spandiary (Maine South, IL) — IL POY, Purdue NW commit
  - + 12 more from Maine South, Mahtomedi, Robinson, Whitney Young, Nordonia
- **107 total players** · 45 high school · 78 female

---

## Open Items — Next Session

### Build Queue
1. **More images for Gallery** — Ambra & Tika provided images. Drop in `public/gallery/`, add to array in `src/app/media/page.tsx`
2. **Episode-to-Blog Conversion** — long-form articles from podcast episodes. Start with Vanita Krouch, Katherine Sowers. Each = new SEO page.
3. **Revisit Top 10 Plays Process** — is player self-submission the right model? Admin notification on new submission? Notify players when featured?
4. **TF Rankings Algorithm (Phase A)** — needs Ambra & Tika to define the 100-pt rubric weights before building.
5. **New Growth Roadmap** — monetization, recruiting tools, national team pages, etc.

### Owner Actions Still Blocking Features
| Env Var | What It Unlocks | Where to Add |
|---------|----------------|-------------|
| `RESEND_API_KEY` | Contact form, welcome email, weekly digest | Vercel → Settings → Environment Variables |
| `CRON_SECRET` | Secures `/api/digest/send` | Vercel |
| `ADMIN_EMAILS` | Gates admin scout/verification pages | Vercel |
| `YOUTUBE_API_KEY` | Live episode fetching | Vercel |
| `PRINTFUL_API_KEY` | Merch store (code is done) | Vercel |
| Amazon affiliate tag | Revenue from equipment blog posts | `src/lib/static-posts.ts` |
| Domain decision | talkinflag.com vs talkinflagshow.com → update Supabase + Google OAuth | Supabase + Google Console |

### Instagram Embed — Future Upgrade
- Current: Official blockquote embeds (free, requires posts to stay public)
- Future option: Behold.so (~$19/mo) for live auto-updating feed — no manual URL updates needed
- Questions for Ambra & Tika:
  1. Which account(s) to show? `@talkinflagshow`, personal, or both?
  2. OK with ~$19/mo for live feed?
  3. Want the feed on homepage too?

---

## Key Files

| What | Where |
|------|-------|
| Nav | `src/components/layout/Nav.tsx` |
| Footer | `src/components/layout/Footer.tsx` |
| Media/Gallery page | `src/app/media/page.tsx` |
| Player types | `src/types/player.ts` |
| Supabase server client | `src/lib/supabase/server.ts` |
| Supabase anon client | `src/lib/supabase/index.ts` |
| Email (Resend) | `src/lib/email.ts` |
| Static blog posts | `src/lib/static-posts.ts` |
| World rankings data | `src/lib/world-rankings.ts` |
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
