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

### Coach IQ Quiz + Universal Save-&-Resume (docs/plans/2026-06-25-coach-iq-quiz-and-save-resume.md) ✅ Branch: coach-iq-quiz
| Phase | Work | Status |
|-------|------|--------|
| 1 | Coach IQ quiz seeded (`category='coach'`, 32 Qs) — `scripts/seed-iq-coach.ts` + `scripts/data/iq-questions-coach.json`. Answer key server-only. | ✅ Done |
| 2 | Per-coach credibility weighting (`src/lib/eval/coachWeight.ts` pure + tested; `coachCredibility.ts` loader; weighted aggregate in `recompute.ts`). Coach role only; expert/host stay equal-weight. Surfaced on coach profile, `/admin/coaches`, `/how-rankings-work`. | ✅ Done |
| 3 | Universal save-&-resume — `008_form_drafts.sql` (RLS no-policy), `/api/drafts`, `useAutosaveDraft` hook (localStorage + debounced cross-device). Wired into IQ runner, eval runner, profile edit, career-update form. | ✅ Done |
| 4 | A+++ polish — Coach IQ card on `/iq`, animated results + "what this unlocks" coach explainer + Share, resume banner / "Saved ✓", reduced-motion + aria. | ✅ Done |
| — | **Owner action:** set `CRON_SECRET` in Vercel so the weekly recompute auto-applies coach weights (manual admin recompute works regardless). | ⏳ Pending |
| — | **Owner action:** confirm each Coach IQ `correct_index` (DRAFT) before it formally counts toward voting influence. | ⏳ Pending |


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
- Player source conventions: `roster_year` (string year), `team_designation` (national_senior/national_junior/national_youth/olympic_2028), `source` (usafootball.com/flagsonly/submitted)

---

## Open Items — Next Session

> ✅ **RLS client sweep + admin gating (2026-07-03/04, branch `rls-sweep`):** all cookie-client
> access to zero-policy (service-only) tables eliminated, and the admin-authz holes it was masking
> closed. Enforced by `src/lib/supabase/usage-guard.test.ts` and `src/lib/admin-gating.test.ts` — if
> you add a table or an admin surface, those tests tell you the rules. **Cookie client
> (`@/lib/supabase/server`) = `auth.getUser()` + policy-backed tables ONLY; every service-only table
> uses a service-role client (`createAdminClient`). Every `/admin` + `/api/admin` surface must gate via
> `getAdminUser`/`isAdminEmail` (or `CRON_SECRET`) — middleware does NOT protect them.** See
> `docs/plans/2026-07-03-rls-client-sweep-and-launch-hardening.md` + the dated follow-up note at the
> bottom of `docs/plans/2026-06-23-security-hardening.md`. Owner actions before stress test: Upstash env
> vars (shared rate limiting), leaked-password toggle, confirm `ADMIN_EMAILS`, `CRON_SECRET` + `RESEND_API_KEY`.
>
> ✅ **2026-07-05 — `ADMIN_EMAILS` (Ambra + Tika added), `RESEND_API_KEY`, `CONTACT_EMAIL_TO`, `CRON_SECRET`
> all set in Vercel** (talkinflag.com domain verified in Ambra's own Resend account), production redeployed.
> ⚠️ **Leaked-password protection is NOT enabled** — the toggle lives in Supabase → Auth → Sign In/Providers →
> Email → "Prevent use of leaked passwords" (checks new passwords against HaveIBeenPwned via the Pwned
> Passwords API), but it's **gated to the Supabase Pro plan ($25/mo)** — the project is on Free, so the
> toggle silently doesn't persist on save. Owner decision 2026-07-05: **defer** (auth here is
> magic-link/Google OAuth first, so password-based attacks are lower-risk than on a password-primary app).
> Revisit if/when the project is upgraded to Pro for other reasons — flip it then, low effort.
>
> ✅ **2026-07-05 (same session) — Upstash rate limiting wired up.** Created a free-tier Upstash Redis
> database (`talkinflag-rate-limit`, N. Virginia/us-east-1, $0/mo, 10GB monthly bandwidth cap). Set
> `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in Vercel (Production + Preview), production
> redeployed. `src/lib/rate-limit.ts` auto-upgrades from in-memory-per-instance to shared Upstash-backed
> limiting the moment those two env vars exist — no code change was needed. **All 4 of the original
> pre-stress-test owner-action items are now closed:** ADMIN_EMAILS, RESEND_API_KEY+CONTACT_EMAIL_TO,
> CRON_SECRET, Upstash. Only the (deferred, Pro-gated) leaked-password toggle remains open by owner choice.
> **Not yet done:** a real authenticated click-through as Ambra/Tika to confirm admin access + host poll
> weight, and that an approval action actually sends an email from `noreply@talkinflag.com`.

> 🔒 **Security hardening plan (P1–P3 SHIPPED `ecec0b9`/`69023e1`/`dfad2ce`):** `docs/plans/2026-06-23-security-hardening.md`
> — rate limiting on public POST routes, newsletter/contact validation + honeypot, input caps done.
> The 2026-06-23 XSS/redirect/injection/admin fixes + DB hardening also shipped (`a878780`). Site
> launched on talkinflag.com. Remaining owner toggles: leaked-password protection, `vector` extension
> (accepted WARN). Resend (welcome email) deferred to Ambra's to-do list.

### 🚨 Owner Actions — Needed Now
See `docs/ambra-update-2026-06-25.md` (content rewritten 2026-07-05, filename kept for the existing CLAUDE.md link) for the current, authoritative owner to-do list. As of 2026-07-05, `CRON_SECRET`, `RESEND_API_KEY`, `ADMIN_EMAILS` (Ambra + Tika added), and Upstash rate-limiting env vars are all done. Remaining real owner actions:

1. **Spotify Show ID** (`NEXT_PUBLIC_SPOTIFY_SHOW_ID`) — audio player on `/podcast` (built, hidden until set).
2. **5 YouTube video IDs** — `YOUTUBE_API_KEY`/`YOUTUBE_CHANNEL_ID` are already live in Vercel; only the 5 `TODO_OWNER` placeholders in `static-posts.ts` (Sowers/Clark-Robinson/Krouch/Doucette/Flores interviews) remain.
3. **`PRINTFUL_API_KEY` + `STRIPE_SECRET_KEY`/`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`** — both exist in local `.env.local` but neither is set in **Vercel production**, so `/merch` cannot list products or take payment live yet. Needs both, not just Printful.
4. **Amazon Associates tag** — swap placeholder `talkinflag-20` in `static-posts.ts` once approved.

> ✅ Done / dropped: host photos (none needed), DB backup tables (already gone), partner URLs (confirmed), CRON_SECRET, RESEND_API_KEY, ADMIN_EMAILS, Upstash. Password protection + login CAPTCHA: deferred. Leaked-password toggle: deferred (Supabase Pro-gated, see above).

### Build Queue
1. **TF Rankings Algorithm** — needs Ambra & Tika to define the 100-pt rubric weights.
2. **More images for Gallery** — drop in `public/gallery/`, add to array in `src/app/media/page.tsx`
3. **Profile claim outreach** — email flow for the 284 flagsonly-imported athletes to claim their profiles. `RESEND_API_KEY` is now live, so this is unblocked whenever it's prioritized.
4. **Interview articles — Q&A upgrade** — the 5 interview posts in `static-posts.ts` are currently editorial paraphrase (no quotes). Once episode transcripts are available, upgrade them to direct Q&A / pull-quotes. **Do NOT invent quotes** — quotes must come from real transcripts.

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
