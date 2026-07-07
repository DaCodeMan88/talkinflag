# Talkin Flag — Stress-Test Audit & Execution Plans (2026-07-06)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix every bug and content issue Ambra & Tika reported during the July stress test (Google Doc "JULY UPDATES" + admin-test notes of 5-7-26), and harden the site before wider test-user traffic.

**Architecture:** Next.js 16 App Router + Supabase (RLS zero-policy tables, service-role server access), Resend for email, Vercel hosting, Sanity/static posts for blog, Stripe/Printful pending. Custom domain `talkinflag.com` now live alongside `talkinflag.vercel.app`.

**Tech Stack:** Next 16.2.6, React 19, Supabase JS v2, Resend, Tailwind, Vitest.

---

## 1. High-level overview

The codebase is in good shape structurally: recent RLS sweep landed (`d7d73dd`), admin gating is unified and guarded by static tests, and there is real unit coverage in `src/lib` (eval, iq scoring, knn, measurements, admin-gating). The stress-test failures are almost all **configuration + data issues**, not architectural ones:

- **Email:** every "no email received" report matches [email.ts](src/lib/email.ts) silently returning when `RESEND_API_KEY` is unset and swallowing Resend errors (console.warn/error only, never thrown, never retried). The one email that *did* work (event-rejection auto-reply on 7/5) suggests the key is now set in prod but some flows either don't send at all (no submitter confirmation emails exist) or fail silently (unverified `from` domain, wrong recipient).
- **Auth/claim:** the claim flow builds `redirectTo` from `window.location.origin` ([LoginForm.tsx:19-33](src/app/auth/login/LoginForm.tsx)) but Supabase/Google OAuth redirect allow-lists are still pinned to the vercel.app URL — so Ambra, testing on `talkinflag.com`, bounced to the vercel homepage and the `next=/auth/claim/...` param was dropped. Claim never completed.
- **Content/data:** broken Find-a-League links, stale Discord invite, outdated coaches/players, placeholder profile metrics, IG posts under "Latest Episodes", missing Spotify show ID (now provided: `033GcNgIw5FPNMr69P5sDU`).

## 2. Findings by category

### Bugs & correctness

- **bug-email-pipeline** — `src/lib/email.ts` (whole file) + every caller (contact, events, scouts, profile submit, claims). Impact: HIGH — all 6 "no email received" reports. Evidence: `if (!process.env.RESEND_API_KEY) { console.warn(...); return; }` and `if (error) console.error(...)` — failures are invisible to callers and admins. Also no submitter confirmation emails exist for profile/event submissions (Ambra explicitly asked for them).
- **bug-claim-redirect** — `src/app/auth/login/LoginForm.tsx:19-33`, `src/app/auth/callback/route.ts`. Impact: HIGH — profile claiming (a core funnel) broken on the custom domain. Evidence: OAuth redirect returns to vercel.app origin; `next` param lost; profile stays unclaimed.
- **bug-share-card** — `src/app/players/[id]/ShareCardModal.tsx`, `src/components/episodes/ShareButton.tsx`. Impact: MEDIUM — mobile share does nothing; LinkedIn desktop opens the LinkedIn homepage instead of a share dialog (likely legacy `linkedin.com/shareArticle` URL; current API is `https://www.linkedin.com/sharing/share-offsite/?url=<encoded>`).
- **bug-profile-metrics** — dashboard profile edit + `src/lib/measurements.ts` render path. Impact: MEDIUM — unset metrics show default/placeholder values; entering `?` hides the value but leaves an empty grey block; Ambra vs Tika see different public stat fields but identical edit forms. Reference profile: player id `ab5214c7-17bf-4f63-ab38-6a6ebe1c9d2c`.
- **bug-uneditable-profile-sections** — player profile career highlights / tournament history / stats. Impact: MEDIUM — data was auto-derived from podcast content, is wrong, and owners cannot edit it.
- **bug-iq-q10** — `scripts/data/iq-questions.json` + Supabase `iq_questions` table (served via `src/lib/iq/load.ts`). Impact: LOW — Q10 "Which of these is NOT a form of flag guarding?" is ambiguous/incorrect.

### Configuration & environment

- **config-spotify-id** — set `NEXT_PUBLIC_SPOTIFY_SHOW_ID=033GcNgIw5FPNMr69P5sDU` in Vercel; player and Spotify links in `src/app/podcast/page.tsx:14` activate automatically.
- **config-auth-domain** — Supabase Auth Site URL + Redirect URLs and Google Cloud OAuth origins must include `https://talkinflag.com` (root cause of bug-claim-redirect). Also confirm `NEXT_PUBLIC_SITE_URL` is the custom domain.
- **config-resend-domain** — verify `talkinflag.com` is a verified sending domain in Resend and `RESEND_FROM` is set; otherwise sends fail silently per bug-email-pipeline.

### Content & data (Supabase / static)

- **data-find-league-links** — `src/app/find-a-league/page.tsx:15,27-31,41-43`. NFL Flag → `https://play.nflflag.com/`; IFAF → `https://www.americanfootball.sport/`; "Flag Football Network" entry unidentifiable → remove.
- **data-discord-residue** — the 6/24 Discord-removal plan existed but Ambra still hit an "invite invalid" link under Community. Verify `/community` and all `discord.gg` references are gone from the deployed site (footer, welcome email HTML in `auth/callback/route.ts`, player page cards, sitemap).
- **data-outdated-roster** — Italy head coach is Jonathan Homer (UK), not Katherine Sowers; Gianluca Santagostino inactive; Vanita Krouch recently cut. Fix in Supabase player/coach rows and any static roster data (`src/lib/world-rankings.ts`).
- **data-partners** — `src/components/home/PartnersStrip.tsx:4-7`: add Flag Football Nation (IG @flagfootballnationofficial) and https://www.womenscollegeflagfootball.com; keep FFF + Athleads (confirmed 6/25). Leave All22 out entirely.
- **data-content-accuracy-sweep** — Daniel's own directive: podcast-derived content contains untrue statements; flag + delete before adding more content ("stress test" precondition).
- **copy-fixes** — "badgemeans" → "badge means" (verified-badge explainer copy); "Network" nav label → "The Talkin Balls Network" (pending the Neil agreement — confirm before renaming).

### UX

- **ux-positions** — `src/app/players/submit/SubmitForm.tsx:5`: `POSITIONS = ["QB","WR","DB","Rusher"]` misses Center, Safety/Blitzer (5v5 IFAF positions). Grad-class field should be optional/N-A for graduated players.
- **ux-latest-episodes** — homepage "Latest Episodes" (`src/app/page.tsx:105-110`) shows Instagram posts; move IG content to Media page, keep episode cards podcast-only.
- **ux-metric-units** — add a kg/cm-first display preference (formatters already dual-render in `src/lib/measurements.ts`; this is a display-order toggle, low priority).

### Tests & reliability

- **test-email-paths** — no test asserts that submission routes attempt to send (and to whom). Cheap static/unit tests would have caught the silent-skip.
- **stress-test-readiness** — before inviting the 2 extra test users: confirm quiz results persist, rankings recompute button works, and check Supabase advisors/logs for errors after each test day.

## 3. Prioritized EXECUTION_PLANS

#### Plan: fix-email-pipeline
Target issues: bug-email-pipeline, config-resend-domain — Priority: **High**

Goal: every submission (contact, event, profile, scout, claim) produces (a) an admin notification and (b) a submitter confirmation email, and failures are loud.

Steps
1. Preparation: read `src/lib/email.ts` and grep callers: `grep -rn "sendEmail" src/app/api src/app`. In Vercel, confirm `RESEND_API_KEY` and `RESEND_FROM` are set in Production. In Resend dashboard, confirm talkinflag.com domain is verified.
2. Change `sendEmail` to return `{ ok: boolean; error?: string }` instead of `void`; keep the no-key guard but log at error level with the intended recipient/subject. Update callers to log route + result.
3. Add submitter confirmation emails to: profile submit, event submit, scout application, contact form (short branded "we got it, an admin will review" template — mirror the existing rejection-email tone).
4. Write a Vitest unit test with a mocked Resend client asserting each API route calls sendEmail with expected `to`/`subject` (follow the pattern in `src/lib/admin-gating.test.ts` for route scanning if full route tests are heavy).
5. Verify: run `npm test`; deploy to preview; submit one of each form; confirm both emails arrive. Commit per flow ("fix: confirmation email for event submissions", etc.).

Notes for cheaper models: don't change the lazy Resend instantiation; don't throw from `sendEmail` (a failed email must never fail the submission); keep HTML templates inline like the existing welcome email in `src/app/auth/callback/route.ts:66`.

#### Plan: fix-claim-redirect
Target issues: bug-claim-redirect, config-auth-domain — Priority: **High**

Goal: signing in with Google from talkinflag.com completes the profile claim and lands the user back on talkinflag.com.

Steps
1. Preparation: Supabase dashboard → Auth → URL Configuration: set Site URL to `https://talkinflag.com`; add Redirect URLs for both `https://talkinflag.com/auth/callback` and `https://talkinflag.vercel.app/auth/callback`. Google Cloud Console → OAuth client: add talkinflag.com to Authorized JavaScript Origins and the Supabase callback to redirect URIs. Vercel: `NEXT_PUBLIC_SITE_URL=https://talkinflag.com`.
2. Code check: in `src/app/auth/callback/route.ts` verify the `next` search param survives the OAuth round-trip (Supabase forwards it only if included in the redirectTo that was allow-listed). Add a fallback: if `next` is missing but the user has a pending claim cookie, resume the claim. Log the received params server-side while testing.
3. Verify: on talkinflag.com, log out, click "claim my profile" on a test player, sign in with a non-admin Google account, confirm redirect returns to `/auth/claim/<id>` on talkinflag.com and the claim row is created. Test on mobile Safari too.
4. Commit.

Notes: don't hardcode the domain in `redirectTo` — `window.location.origin` is correct once the allow-list is fixed. Watch case: vercel preview deploys will still need the wildcard/preview redirect entry.

#### Plan: config-and-content-quick-wins
Target issues: config-spotify-id, data-find-league-links, data-partners, data-discord-residue, copy-fixes, ux-positions, ux-latest-episodes — Priority: **High** (all trivial-effort, do in one session)

Goal: knock out every one-line config/content item from the doc.

Steps
1. Vercel: set `NEXT_PUBLIC_SPOTIFY_SHOW_ID=033GcNgIw5FPNMr69P5sDU`; redeploy; confirm player renders on /podcast.
2. `src/app/find-a-league/page.tsx`: NFL Flag href → `https://play.nflflag.com/`; IFAF href → `https://www.americanfootball.sport/`; delete the Flag Football Network entry (lines ~41-43).
3. `src/components/home/PartnersStrip.tsx`: add `{ name: "Flag Football Nation", url: "https://www.instagram.com/flagfootballnationofficial/" }` and `{ name: "Women's College Flag Football", url: "https://www.womenscollegeflagfootball.com" }`. Update the confirmation comment date.
4. Discord: `grep -rn "discord" src public` must return nothing; check the deployed site's Community nav/footer — if a `/community` route or invite link is still live, remove it and its sitemap entry (see docs/plans/2026-06-24 for the full file list).
5. `src/app/players/submit/SubmitForm.tsx:5`: `POSITIONS = ["QB", "WR", "C", "DB", "Safety", "Rusher"]` (confirm exact IFAF 5v5 set with Daniel); make graduation-class not required — add a "Graduated / N-A" option.
6. Homepage `src/app/page.tsx:105`: if the Latest Episodes grid is fed by Instagram embeds, restrict it to podcast episodes and move IG content to `/media`.
7. Fix "badgemeans" typo wherever the verified-badge explainer copy lives (`grep -rn "badgemeans\|badge means" src`).
8. Verify each on preview deploy, then commit per item.

Notes: hold the "Network → The Talkin Balls Network" rename until Daniel confirms the Neil agreement outcome. Do NOT add All22 anywhere.

#### Plan: fix-share-card
Target issues: bug-share-card — Priority: **Medium**

Goal: player-card share works on mobile (Web Share API) and LinkedIn desktop opens a proper share dialog.

Steps
1. Read `src/app/players/[id]/ShareCardModal.tsx` and `src/components/episodes/ShareButton.tsx`. Reproduce: mobile viewport in devtools (`navigator.share` requires user gesture + HTTPS + `canShare` check — verify the call isn't wrapped in an async gap that loses the gesture).
2. LinkedIn: replace any `shareArticle`/`mini=true` URL with `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`. LinkedIn pulls title/image from OG tags — verify the player page emits `og:image` (the `src/app/og` route exists; confirm it's referenced in player page metadata).
3. Mobile: guard with `if (navigator.share) await navigator.share({ title, url })` inside the click handler directly; fall back to copy-link with a toast.
4. Verify with preview deploy on a real phone; test LinkedIn share shows the card image. Commit.

#### Plan: fix-profile-editing
Target issues: bug-profile-metrics, bug-uneditable-profile-sections — Priority: **Medium** (investigate first — some of this is data, not code)

Goal: claimed players see only real data on their public profile, can edit or clear every section, and unset metrics render nothing (no grey block, no defaults).

Steps
1. Preparation: pull Ambra's row (`players` id `ab5214c7-17bf-4f63-ab38-6a6ebe1c9d2c`) and Tika's via Supabase MCP `execute_sql`; diff which columns are populated — this explains "different stats, same edit form". Identify where career highlights / tournament history / stats live (separate tables?) and whether the dashboard edit form covers them.
2. Render fix: audit the profile stat blocks — any metric that is null/`"?"`/0 must skip the block entirely (use the empty-string convention already in `src/lib/measurements.ts` formatters). Remove whatever inserts default measures on partial save (likely form fields posting `0`/placeholder instead of null — coerce empty inputs to null in the API route).
3. Edit fix: extend the dashboard edit form (or an admin-side editor as stopgap) to cover career highlights, tournament history, and stats — or at minimum a "report incorrect info" that admins can act on. Decide scope with Daniel: full self-edit vs admin-mediated.
4. Data fix: correct/delete the wrong podcast-derived entries for Ambra & Tika now via SQL as immediate relief.
5. Tests: unit test the null-coercion helper; verify: edit Ambra's profile end-to-end, save with fields blank, confirm public page shows no placeholders. Commit incrementally.

Notes: writes to `players` must go through the service-role client (RLS zero-policy — see commits `429a65d`, `ba5ba1a`); never add cookie-client writes.

#### Plan: data-accuracy-sweep
Target issues: data-outdated-roster, data-content-accuracy-sweep, bug-iq-q10 — Priority: **Medium** (data-only, no deploy needed for DB rows)

Goal: roster/coach data current; wrong auto-generated content removed; IQ Q10 fixed.

Steps
1. Supabase: update Italy head coach to Jonathan Homer (UK); mark/remove Katherine Sowers as head coach; mark Gianluca Santagostino inactive; update Vanita Krouch's status (cut). Check `src/lib/world-rankings.ts` for static duplicates of these names.
2. IQ Q10: edit the "flag guarding" question in `scripts/data/iq-questions.json` (+ coach file if present) AND the `iq_questions` Supabase row so DB and seed agree. Make the NOT-option unambiguous.
3. Content sweep: export blog/static posts (`src/lib/static-posts.ts`) + player bios into a checklist doc for Ambra & Tika to mark true/false; delete flagged items. (This is the doc's explicit stress-test precondition.)
4. Verify pages render after row changes; commit seed-file edits.

#### Plan: stress-test-readiness
Target issues: stress-test-readiness, test-email-paths — Priority: **Medium**

Goal: the 4-person test cohort (Ambra, Tika, +2 invitees) can exercise sign-up, quiz save, and rankings recompute with monitoring in place.

Steps
1. Verify quiz persistence: complete a quiz as a test user; check the results row lands (`api/iq/submit`). Verify rankings recompute button on /admin/rankings updates TF Rank values.
2. Run Supabase `get_advisors` (security + performance) and review; fix anything critical before the cohort starts.
3. After each test day: check Vercel runtime logs and Supabase logs for errors, especially email send errors (now loud after fix-email-pipeline).
4. Add the missing email-path tests from fix-email-pipeline step 4 if not already done.

#### Plan: unit-preference-toggle
Target issues: ux-metric-units — Priority: **Low**

Goal: profiles can display cm/kg first. Steps: add a small client toggle (localStorage) that swaps the order of the already-dual-rendered strings from `formatHeight`/`formatWeight`; default stays lbs/ft. Only do after all High/Medium plans ship.

#### Plan: services-tab-decision
Target issues: (Ambra's "add paid services tab?" question) — Priority: **Low / on hold**

Daniel's answer in the doc: skip $50/hr 1-on-1 coaching; the better angle is appearances, speaker engagements, program evaluations, and start-up guides. No build work until Ambra/Tika/Daniel agree the offering list. Capture as a future page spec, not code.

## 4. Roadmap

**Phase 1 — Safety & broken funnels (this week, before more test users):** fix-email-pipeline → fix-claim-redirect → config-and-content-quick-wins. These three cover ~80% of the doc's complaints and are low-effort/high-impact.

**Phase 2 — Trust & data quality:** fix-profile-editing → data-accuracy-sweep → fix-share-card → stress-test-readiness.

**Phase 3 — Quality of life:** unit-preference-toggle → services-tab-decision → "Network" rename (post-Neil agreement) → highlights[] on StaticPost for clips.

**Also queued from doc (non-code):** Printful store connection (invite accepted?), Stripe blocked on US business formation, Amazon Associates tag deferred (Daniel: "pause, not necessary"), RSS feed = Spotify-hosted feed for Apple Podcasts distribution.
