# Talkin Flag — Update for Ambra & Tika (2026-07-05)

Hi Ambra & Tika — this replaces the last update. Big one: **you're both officially admins now**, and the security/email/rankings plumbing behind the scenes is fully wired up. Below is what's live, what (little) is still on your plate, and what's parked for later.

---

## You're in — log in and take a look

Your emails (`ambramarcucci1@gmail.com` and `martikamarcucci@gmail.com`) are now set as admins. When you sign in (magic link or "Continue with Google," whichever you used to give us the email), you'll automatically get:

- **Admin access** — the full back-office at `/admin`: review player claims (`/admin/claims`), profile reports (`/admin/reports`), pending career updates (`/admin/credentials`), highlight/plays submissions, verification requests, events, scouts/coaches, and the rankings recompute button.
- **"Host" poll weight** — your Evaluation + Flag IQ answers now count toward the Host slice of the ranking algorithm (Hosts/Coaches/Experts blend).

**One ask:** log in once and click around `/admin` so we can confirm everything renders correctly for you both — that click-through has never actually been tested with your real logins.

---

## What's live now (since the last update)

- **Email is fully turned on.** Contact form replies, career-update approval notices, verification approvals, claim notifications — all of it now sends from `noreply@talkinflag.com` through a Resend account we set up specifically for Talkin Flag (kept separate from the agency's Resend account on purpose, so quota/billing never mixes).
- **Weekly rankings now auto-run.** Every Sunday at 02:00 UTC, no manual click needed. (The admin "Recompute Rankings Now" button still works anytime too.)
- **Join / claim flow rebuilt for safety.** New members sign in first, then either claim an existing profile or create their own (auto-linked to their account, no ambiguity). Every claim is logged and emails the admins. Self-submitted profiles sit in "Pending Review" until an admin approves them — invisible to the public until then.
- **Career Updates loop is live** — members log championships, postseason runs, awards, role changes, etc. from their dashboard; you approve in `/admin/credentials`; approved ones show on their public profile and can bump their ranking.
- **Coach IQ quiz shipped** — a real credibility test (not just trivia) that feeds coach poll weight, separate from the general Flag IQ quiz.
- **Save & resume everywhere** — the Evaluation, Flag IQ, and profile-edit forms now save progress automatically, so nobody loses their answers if they close the tab partway through.
- **A full security pass shipped** — closed a bug class where several admin pages and public pages were silently reading a locked-down database incorrectly (some had been broken since launch, e.g. the admin players list, the claim button, results/plays pages). All confirmed fixed and tested.

---

## Your to-do list (short now — most of the old list is done)

| # | Key / Action | What it turns on | Where |
|---|---|---|---|
| 1 | **Spotify Show ID** | Audio player on `/podcast` (already built, just hidden until you send the ID from your Spotify for Podcasters dashboard URL — `open.spotify.com/show/<ID>`) | Send us the ID |
| 2 | **5 YouTube video IDs** for the interview blog posts | Replaces placeholder text with real embedded clips on 5 existing articles (Sowers, Clark-Robinson, Krouch, Doucette, Flores) | Send us the video links once posted |
| 3 | **Printful + Stripe keys** | Turns on the merch store (`/merch` — page is built, but currently can't actually list products or take payment without both of these) | Printful account + Stripe account → send us the keys |
| 4 | **Amazon Associates tag** | Swaps the placeholder affiliate tag (`talkinflag-20`) in gear-recommendation articles for your real one | Once your Amazon Associates application is approved |

**Not blocking anything, low priority:** Apple Podcasts already links out fine (a working search link), it just isn't a direct link to your specific show yet — send the direct URL whenever you have it and we'll swap it in.

---

## Decisions on record (no action needed)

- ✅ Talkin Flag has its own dedicated Resend account (not nested in the agency's).
- ✅ Rankings recompute weekly, Sundays, fully automatic.
- ✅ Talkin Flag runs its own YouTube / Spotify / Apple channels; the show itself stays on the Talkin Balls Network.
- ✅ Homepage partners (Flag Football Finder, Athleads) confirmed live.
- ✅ Expert and Player IQ quiz variants — not building these, general + Coach IQ cover it.

---

## Parked (by your call — revisit whenever)

- **Login CAPTCHA** — site is already secure without it; add later if spam becomes a problem.
- **"Leaked password" protection** — a Supabase feature that blocks known-breached passwords. Only available on Supabase's paid Pro plan ($25/mo); low priority since login here is magic-link/Google, not password-based. Flip it on if we ever upgrade Supabase for another reason.
- **Spanish translation + Mexico's top women's league depth** (international expansion).
- **Gallery redesign + TikTok embeds** — needs a TikTok handle from you first.
- **Host photos** — none needed, current set is final.
