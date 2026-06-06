# Talkin Flag — Claude Code Context

**Project root:** /Users/danielharris/Desktop/Flag/talkinflag/
**Live site:** https://talkinflag.vercel.app
**Stack:** Next.js 15 App Router · TypeScript · Tailwind · Supabase · Resend · Vercel

---

## Active Roadmap

**File:** `docs/plans/2026-06-05-traffic-growth-roadmap.md`

**To start the next build session, say:**
> "Read CLAUDE.md and let's continue from the open items."

### Traffic Growth Phases — All Shipped ✅
| Phase | Feature | Status |
|-------|---------|--------|
| A | TF Rankings Algorithm | Deferred (needs rubric input from Ambra & Tika) |
| B | Athlete Profile of the Week | ✅ Live |
| C | Top 10 Plays of the Week | ✅ Live (process to revisit) |
| D | Profile Embed Widget + Share Card | ✅ Live |
| E | Tournament Results | ✅ Live |
| F | League Finder Partnership | ✅ Live |
| G | Player Comparison Tool | ✅ Live |

---

## Open Items — Next Session

### Build Queue
1. **Gallery / Media Page** — Ambra & Tika provided images; build `/media` or `/gallery` page to display them. Also explore embedding their Instagram feed (see notes below).
2. **Episode-to-Blog Conversion** — convert podcast episodes into long-form Rolling Stone-style articles. Start with highest-profile guests (Vanita Krouch, Katherine Sowers, etc.). Each article = new SEO page.
3. **Revisit Top 10 Plays Process** — is player self-submission the right model? Consider admin-sourced highlights + email notification to admin on submission + notify players when featured.
4. **TF Rankings Algorithm (Phase A)** — deferred until Ambra & Tika define the 100-pt rubric weights.

### Instagram Feed Embed
- Ambra & Tika want their IG feed embedded on the site.
- **Options (best to worst):**
  1. **Behold.so** — paid service (~$19/mo), no Meta app approval needed, clean React embed, good caching. Recommended.
  2. **Elfsight** — similar paid widget, easier setup but less customizable.
  3. **Instagram Graph API** — free but requires Meta Business verification + approved app. Complex setup, rate limits.
  4. **Manual curated grid** — just display static images from the gallery page with a link to IG. No API needed.
- **Decision needed:** Which IG account(s) to show? @talkinflagshow? Ambra's personal? Tika's personal?
- **Recommendation:** Start with manual curated grid on the Gallery page (images they provided), add a "Follow us on Instagram" CTA. Revisit live embed once they decide on the account and budget.

### Owner Actions Still Blocking Features
| Env Var | What It Unlocks |
|---------|----------------|
| `RESEND_API_KEY` | Contact form, welcome email, weekly digest |
| `CRON_SECRET` | Secures `/api/digest/send` |
| `ADMIN_EMAILS` | Gates admin scout/verification pages |
| `YOUTUBE_API_KEY` | Live episode fetching |
| `PRINTFUL_API_KEY` | Merch store (code is done) |
| Amazon affiliate tag | Revenue from equipment blog posts |
| Domain decision | talkinflag.com vs talkinflagshow.com — then update Supabase + Google OAuth |

### Database — What's Been Added
- **Tournament Results:** 21+ high school & international championship events (2024-2026), all sanctioned states
- **Player Profiles:** 18 named players from championship games with stats (Ariana Akey, Taimane & Jade Skipps, Annie Keith, Samaya Taylor-Jenkins, Shaleah Moore, Aribella Spandiary, etc.)
- **107 total players** in DB · 45 high school · 78 female

---

## Pending Owner Actions

- Add `RESEND_API_KEY` to Vercel env vars — activates contact form, welcome email, weekly digest
- Add `CRON_SECRET` to Vercel env vars — secures `/api/digest/send`
- Add `ADMIN_EMAILS` to Vercel env vars — gates admin scout/verification pages
- Add `YOUTUBE_API_KEY` to Vercel env vars — enables live episode fetching
- Add `PRINTFUL_API_KEY` to Vercel env vars — activates merch store (code is done)
- Swap Amazon affiliate tag `talkinflag-20` for real tag in `src/lib/static-posts.ts`
- Finalize domain (talkinflag.com or talkinflagshow.com), then update Supabase + Google OAuth
- **Provide images for Gallery page** — drop in `public/gallery/` or share URLs

---

## Key Files

| What | Where |
|------|-------|
| Nav | `src/components/layout/Nav.tsx` |
| Footer | `src/components/layout/Footer.tsx` |
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
