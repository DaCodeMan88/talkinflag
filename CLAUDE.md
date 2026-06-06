# Talkin Flag — Claude Code Context

**Project root:** /Users/danielharris/Desktop/Flag/talkinflag/
**Live site:** https://talkinflag.vercel.app
**Stack:** Next.js 15 App Router · TypeScript · Tailwind · Supabase · Resend · Vercel

---

## Active Roadmap

**File:** `docs/plans/2026-06-05-traffic-growth-roadmap.md`

**To start the next build session, say:**
> "Read docs/plans/2026-06-05-traffic-growth-roadmap.md and start with Phase A. Use superpowers:executing-plans."

### Phases at a glance
| Phase | Feature | Status |
|-------|---------|--------|
| A | Talkin Flag Player Rankings Algorithm | Not started |
| B | Athlete Profile of the Week | Not started |
| C | Top 10 Plays of the Week | Not started |
| D | Profile Embed Widget + Share Card Fix | Not started |
| E | Tournament Results | Not started |
| F | League Finder Partnership | Not started |
| G | Player Comparison Tool | Not started |

---

## Pending Owner Actions (before certain features work)

- Add `RESEND_API_KEY` to Vercel env vars — activates contact form, welcome email, weekly digest
- Add `CRON_SECRET` to Vercel env vars — secures `/api/digest/send`
- Add `ADMIN_EMAILS` to Vercel env vars — gates admin scout/verification pages
- Add `YOUTUBE_API_KEY` to Vercel env vars — enables live episode fetching
- Add `PRINTFUL_API_KEY` to Vercel env vars — activates merch store (code is done)
- Swap Amazon affiliate tag `talkinflag-20` for real tag in `src/lib/static-posts.ts`
- Finalize domain (talkinflag.com or talkinflagshow.com), then update Supabase + Google OAuth

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
