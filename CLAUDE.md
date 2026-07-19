# Talkin Flag — Claude Code Context

**Project root:** /Users/danielharris/Desktop/Flag/talkinflag/
**Live site:** https://talkinflag.vercel.app
**Stack:** Next.js 15 App Router · TypeScript · Tailwind · Supabase · Resend · Vercel

---

## Active Roadmap

**✅ SHIPPED 2026-07-19: Cohort rankings + players UX overhaul** — plan `docs/plans/2026-07-18-cohort-rankings-ui-overhaul.md` (merged to `main`, fast-forward, tip `6ad4334`; tsc clean, 202/202 tests, `npm run build` green; E2E browser-verified incl. 375px).
- **Root problem fixed:** rankings were one global pool + `PlayersFilter` titled the unfiltered table "High School Rankings", so a national-team player (Ambra) appeared "8th among HS kids." Now rankings are split into **two independent cohorts** — **HS (18U)** = `high_school`+`youth`; **College/World (cw)** = everything else, with `null`→`cw` so adults never leak into 18U.
- `src/lib/rankings/cohort.ts` — pure `cohortForLevel` / `cohortRankLabel` / `COHORT_LABELS` (tested). `computeCohortRanks` in `tfRank.ts` partitions then delegates to the untouched `computeTfRank`; `recompute.ts` writes per-cohort ordinals + cohort-tagged top-100 snapshots (migration `017_ranking_snapshot_cohort.sql`, applied live).
- **Silent write-back bug found + fixed (`74fb80e`):** every prior recompute's players write-back had been failing silently — a partial-column upsert can't satisfy `players`' NOT NULL `first_name` (Postgres checks the tuple before `ON CONFLICT`). Replaced both write loops with batched per-row `UPDATE`s that throw on error.
- Cohort labels ("HS #8" / "CW #8") now render on every rank surface (PlayerCard, ShareCardModal, `/rankings` split into two tables, compare, OG/satori). Dead `RankingsHub.tsx` deleted (−366 lines, zero imports). `/players` rebuilt: cohort-first segmented control with counts, dual Top-5 leaderboards on the All view (no mixed table can render), sticky filters, dismissible filter chips.
- **Live recompute already run against prod** (412 ranked): Ambra now **CW #42**; HS #1 Samaya Taylor-Jenkins; CW #1 Tika. **Do not re-run it.**
- **Polish (2026-07-19, `6ad4334`):** grad-year chip now reads "Class of 2027" (matched every other surface); added a full **College/World** cohort view (`level=cw`, filters by cohort incl. null/other levels) so every player in the CW Top-5 card is reachable — the CW card's "Full rankings →" targets it, with a matching chip + bracket active-state.
- **Deferred (none blocking):** `api/players/search` typeahead still orders by global `ranking_national` (harmless dup "#1"s in a name dropdown); historical `ranking_snapshots` rows keep `cohort=null` (pre-split history).

**✅ SHIPPED 2026-07-18: Final polish + admin 10x** — plan `docs/plans/2026-07-18-final-polish-admin-10x.md` (all 14 tasks done; tsc clean, 192/192 tests, build green; every task verified in local preview incl. 375px).
- **Task 0 (critical):** dashboard selected a nonexistent `players.team` column → PostgREST rejected the whole query → claim card + "Find & claim" checklist step broken for EVERY user (this was Ambra's "claim step never checks off"). Fixed + error now logged; `.maybeSingle()` → `.limit(1)` hardening (Task 11).
- **New `/auth/confirm` route** consumes magic-link `token_hash` (`verifyOtp`) — fixes the documented caveat where admin `generateLink` links landed on `/auth/auth-error` (PKCE-only callback). E2E verification of the claimed dashboard now works: `e2e-claim-check.ts setup` → `/auth/confirm?token_hash=…` (torn down after, 0 rows left).
- grad_year now accepts 1950–2040 (was silently nulling anything outside 2024–2032 — Ambra's 2017 never saved; she must re-enter it once). `sanitizeGradYear` in `src/lib/profile-edit.ts` + tests.
- Change requests: `/dashboard/edit` now shows per-field rows (5 guarded fields) with inline editors + yellow "Pending review" chips (server-fetched + optimistic). Roster year finally discoverable.
- Public Stats card: explicit allowlist (Club/Jersey #/Nickname/Roster Year) with labels; internal keys (team_designation, source…) never render; `min-w-0 break-words` fixes 375px overflow.
- TikTok: migration `015_player_tiktok.sql` (applied live), PATCH route, edit-form field; `SocialLinks` component (icon + @handle rows, IG+TikTok) on profiles + JSON-LD sameAs.
- Metric entry: FT/LBS ↔ CM/KG toggle in edit form (converts on switch, stores imperial; verified 175cm/65kg → 69in/143lbs → renders 5'9" / 175 cm).
- Admin: sidebar shell (`AdminSidebar.tsx`, desktop rail + mobile drawer, layout `pt` clears fixed site nav), Overview rebuilt (needs-attention chips + 8 stat cards — members/growth/players/claimed/verified/evals — all spot-checked vs SQL), `/admin/members` directory (search/filters/sort, desktop table + mobile cards, completion % via shared `src/lib/profile/completion.ts`), players list paginated 50/page (was hard-capped at 100 of 413) with search counts.
- Terms + Privacy updated from Ambra's edited draft (`~/Downloads/TKF Terms & Privacy.md`): age 13→**14**, third-party content, no-warranty bullets, service availability, technical-data collection, retention table, full GDPR rights incl. Garante, cookies (browser-settings wording only), processors, SCCs, security, dates → July 18 2026.
- **DECISION OPEN (owner): governing law / entity jurisdiction (Texas LLC vs Italy/Florence)** — blocks final Terms (governing law) + Privacy (data controller) language; TODO comments sit in both files. Ambra's draft says Italy/Florence; Daniel says likely Texas.
- **DECISION OPEN (owner): cookie banner + standalone Cookie Policy** — Ambra's draft references both; neither exists. Privacy page currently says "manage via browser settings" only. Decide whether to build a banner/policy or keep the soft wording.
- Ambra follow-ups: she must re-enter grad year 2017 once; her roster-year change request flow now visible (she's admin and can approve her own); draft update message at `docs/ambra-update-2026-07-18.md` (Daniel sends).
- Data oddity noticed in passing (NOT changed): her profile `country` renders "The Netherlands" + `caps=2` while CLAUDE.md open questions say confirm `caps=24` — worth checking with her.

**🔶 IN FLIGHT 2026-07-16 (merged+pushed `95c6310`/`aacc141` on main; Vercel deploy was BUILDING when session paused): Claim-visibility closure + nav rework** — plan `docs/plans/2026-07-16-claim-visibility-closure-and-nav-menu.md` (read it first; it contains the full evidence table).
- **Investigation result:** Ambra's "still unclaimed / claim again" is NOT reproducible server-side — DB claimed+approved on her only account (`ambramarcucci1@gmail.com`, successful sign-in 07-16 07:18 UTC), prod was on latest main, live profile renders "✓ Claimed" with zero claim CTAs (the 8 "Unclaimed" chips on her page belong to similar-players cards). Her "login didn't work on the other phone" points at Google OAuth being blocked in in-app browsers (Instagram/WhatsApp webviews).
- **Shipped in this merge (all spec+quality reviewed):** Nav = Players·Teams·Coaches·Scouts(/scouts/apply)·Podcast·About (Blog/Events removed from nav, kept in footer) `054e4ab`; in-app-browser login banner + `src/lib/in-app-browser.ts` (6 tests) `1b924d9`+`7f7c658`; state-aware /welcome claim card `16e76ce`; tour copy de-claimed `c4db0b4`; `scripts/e2e-claim-check.ts` (disposable prod E2E identity, setup/teardown, idempotent) `a6aac41`. tsc clean, 188/188 tests, build green.
- **REMAINING (do next session):**
  1. Confirm deploy `dpl_FDmwhzCQSTk8kcHLHwQLWiW3U6Nx` (commit `aacc141`) went READY; live check = `curl -s https://talkinflag.com | grep -c '>Coaches<'` returns **2** (nav+footer; footer alone = 1 = old build), plus 375px hamburger click-through.
  2. Run the E2E proof: `npx tsx scripts/e2e-claim-check.ts setup` → open printed magic link → verify /dashboard shows "✓ Claimed" card + checklist "Your player profile" done + /welcome shows "Your profile is claimed ✓" → `teardown` (then verify 0 ClaimCheck rows). CAVEAT from review: admin `generateLink` may land on /auth/auth-error (PKCE vs implicit) — if so, consume via token_hash/verifyOtp instead; it's a link-consumption issue, not data.
  3. Send Ambra the closure message (draft in plan Task 7): evidence + ask for a dashboard screenshot INCLUDING the email line under the "Dashboard" heading if she still sees claim prompts + in-app-browser guidance.

**✅ SHIPPED 2026-07-15 (`54a80dd` on main, pushed → Vercel): Roster-year self-correction + duplicate-account cleanup** — follow-up to Ambra's "still shows roster year 2024 that I can't edit."
- Her "claim my profile still showing" was **not a live bug** — DB shows her profile fully claimed+approved, she's on the right account, and the live page renders "✓ Claimed" (served `no-store`, no stale ISR). Her feedback predated the `1d8fc8c` deploy; a hard-refresh clears it.
- Real gap fixed: `roster_year` (in `players.stats` JSONB) added to the guarded change-request flow — `src/lib/profile/change-request.ts` (`isStatsField()`/`STATS_GUARDED_FIELDS`, 4-digit-year 2000–2035 validation), the POST + admin PATCH routes **merge into `stats` JSONB** (not a phantom column), `ChangeRequestForm.tsx` numeric input, migration `014_change_request_roster_year.sql` (applied live).
- Deleted duplicate `marcucci_martika@hotmail.com` auth account (verified empty first); her real `martikamarcucci@gmail.com` untouched.
- Verified: tsc clean, 9/9 change-request tests, `npm run build` green. Auth-gated form not click-tested — Ambra's next attempt is the real verification.

**✅ SHIPPED 2026-07-15 (`1d8fc8c` on main): Onboarding/profile UX overhaul** — plan `docs/plans/2026-07-14-onboarding-and-profile-ux-overhaul.md`. `src/lib/profile/viewer-state.ts` (single source of truth for claim badge / CTA / owner edit bar — owner no longer sees the stranger "Claim Profile" view on their own profile); soft fields (position/city/country) self-editable via PATCH; guarded fields (name/team/level, now +roster_year) go through `profile_change_requests` + `/admin/change-requests`; `getEpisodes()` prefers a curated `YOUTUBE_PLAYLIST_ID` with a Shorts filter fallback. **OWNER ACTION:** set `YOUTUBE_PLAYLIST_ID` in Vercel (a playlist of real episodes only) so the podcast feed stops using the weaker channel-search fallback.

**✅ SHIPPED 2026-07-11 (`32b5a5f` on main, deploying to talkinflag.com): Instagram image share + eval archetype share card** — plan at `docs/plans/2026-07-11-instagram-image-share-and-eval-share-card.md`. All 6 tasks done, verified (tsc/149 tests/build green; PNGs render at correct dims; verified-stat gate proven both ways; eval route 401 for anon). Delivered:
- `src/app/players/[id]/card/route.tsx` — player card PNG (edge, `no-store`), `?format=post|story` → 1080×1080 / 1080×1920, verified-stat gating re-derived server-side (never trusts client toggle params).
- `src/components/share/ImageShareButtons.tsx` (client) — pre-fetches the PNG blob (debounced) so `navigator.share({files})` fires inside the click gesture (iOS rule); `canShare({files})` feature-detect → Share Image on mobile, Download on desktop.
- `src/app/players/[id]/ShareCardModal.tsx` — Post/Story toggle + ImageShareButtons at top of actions; removed the old "screenshot this card" note.
- `src/app/api/eval/card/route.tsx` — auth-gated archetype card PNG (**Node** runtime, cookie `auth.getUser()` → admin read of latest `eval_responses` + `eval_reference`), radar + archetype + top-3 + CTA.
- `src/components/eval/PerspectiveSummary.tsx` — "Share your archetype" section (covers post-submit AND `/evaluate/results`) + copy-quiz-link.
- **Gotcha learned:** satori (next/og `ImageResponse`) throws on `<svg><text>` — radar axis labels are absolutely-positioned HTML `<div>` overlays, not `<text>`. The on-page `RadarChart.tsx` still uses `<text>` (fine in the real DOM).
- **OWNER (Ambra real-phone) test still open:** profile → Share Card → Post to Instagram → share sheet shows IG Post + Story; story fills 9:16; eval summary → Share your archetype → same.

**Prior shipped (2026-07-11, `feb840a` on main): Ambra feedback round 3** — `/evaluate/results` page (saved eval results retrievable), claim-route ISR revalidation, "✓ Claimed" badge, live events-DB corrections (World Champs → Aug 13–16 Düsseldorf/worldflag26.com; bogus Women's WC 2026 unpublished; dead efaf.eu/adriabowl.com links fixed).

**Prior shipped: Phase 2 — Trust, Data Quality & Legal Hardening** (`docs/plans/2026-07-10-phase-2-trust-data-and-legal.md`, shipped 2026-07-11, merged to `main` at `d51c9b3`, live on talkinflag.com). Delivered: blog CTAs no longer imply interviews, profiles hide unset stats (no grey blocks), claimed players self-edit highlights/tournaments/key stats (verification resets on stat change), roster/coach accuracy sweep (Italy W coach → Jonathan Homer), varied eval answer anchors, LinkedIn/Web-Share fixes, and — biggest — `/privacy` + `/terms` pages, footer/sitemap links, and a data-source/removal notice on unclaimed profiles (GDPR Art. 14). See also the legal risk review `docs/legal-risk-review-2026-07-10.md`.

**Older master plan (Phases A–F all shipped weeks ago):**
`docs/plans/2026-06-06-community-rankings-platform.md` — the Community Rankings Platform. Retained as historical reference; do NOT treat its "execute Phase A" instruction as live.

**To start the next build session, say:**
> "Read CLAUDE.md and the newest plan under docs/plans/; check its task list against `git log --oneline` before executing anything."

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

**Legal (from the 2026-07-10 legal risk review — do before monetizing):**
- **Form the US entity (LLC) BEFORE any Stripe/merch/paid feature.** Taking payments as an unformed venture puts personal liability on the founders. Order is: entity → Stripe → merch. Hold this line.
- **Get the Talkin Balls / Neil "Network" partnership in writing** (revenue/IP split + naming license) before the nav "Network" rename ships.
- **Have a real attorney skim `/privacy` + `/terms`** now that they're live — especially the GDPR legitimate-interest basis and the scraped-athlete disclosure. (These pages are Claude-drafted, not attorney-reviewed.)

**Phase 2 open owner questions (data confirmations, surfaced 2026-07-11):**
- Ambra: confirm `caps=24` and `world_appearances=2` (her old profile text said 34 caps — corrected to match `caps`, single source of truth).
- Confirm **Jonathan Homer** as current Italy women's HC (spelling + still current) — set live in `coaches` + `world-rankings.ts`.
- **Real-phone share test** of the LinkedIn share + native share-sheet + OG card (can't be tested from a server).

**Config / content (unchanged from before):**
1. **Spotify Show ID** (`NEXT_PUBLIC_SPOTIFY_SHOW_ID` = `033GcDrvvxwkeS2MeKslvf`) — **corrected 2026-07-11 from the owner's Spotify dashboard screenshot.** The previously-recorded `033GcNgIw5FPNMr69P5sDU` was a transcription error (same `033Gc` prefix, wrong tail). Note: a brand-new show with no published episode is NOT publicly listed on open.spotify.com yet, so BOTH IDs 404 on the public site right now — that's expected, not proof of a bad ID. Env var stays unset until the first episode is published (then set it to `033GcDrvvxwkeS2MeKslvf`; the `/podcast` player auto-activates).
2. **5 YouTube video IDs** — `YOUTUBE_API_KEY`/`YOUTUBE_CHANNEL_ID` are already live in Vercel; only the 5 `TODO_OWNER` placeholders in `static-posts.ts` (Sowers/Clark-Robinson/Krouch/Doucette/Flores interviews) remain.
3. **`PRINTFUL_API_KEY` + `STRIPE_SECRET_KEY`/`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`** — both exist in local `.env.local` but neither is set in **Vercel production**. Stripe is additionally **blocked on US business formation** (see legal, above) — do NOT take payments before the entity exists.
4. **Amazon Associates tag** — swap placeholder `talkinflag-20` in `static-posts.ts` once approved (add the FTC affiliate disclosure when unpaused).

> ✅ Done / dropped: host photos (none needed), DB backup tables (already gone), partner URLs (confirmed), CRON_SECRET, RESEND_API_KEY, ADMIN_EMAILS, Upstash. Password protection + login CAPTCHA: deferred. Leaked-password toggle: deferred (Supabase Pro-gated, see above). **Phase 2 (trust/data/legal) SHIPPED 2026-07-11** — see Active Roadmap.

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
