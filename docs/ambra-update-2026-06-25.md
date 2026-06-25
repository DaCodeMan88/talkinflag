# Talkin Flag — Update for Ambra & Tika (2026-06-25)

Hi Ambra & Tika — quick rundown of what's new on the website, and a short to-do list of things only you can flip on. Nothing here is broken; these are the keys that unlock features we've already built.

---

## What's new this week

- **Career Updates ("reasons to come back").** Members can now log a new championship, postseason run, title game, award, role change, event covered, or clinic hosted from their dashboard → **Career Updates**. You approve them in **Admin → Career Updates**, and approved updates show on the member's public profile. Championship/postseason/award updates also feed the weekly ranking refresh.
- **Rankings now release weekly** (not nightly). They recompute every **Sunday at 02:00 UTC** — a few hours before the Sunday digest — so the weekly rankings are fresh. (Needs the `CRON_SECRET` key below to run automatically; until then you can hit "Recompute Rankings Now" on the admin rankings page anytime.)
- **Flag IQ on profiles.** A member's best Flag IQ score now appears on their public player profile.
- **Partners confirmed** — Flag Football Finder and Athleads links on the homepage are confirmed live.
- **Separate channels noted.** The podcast stays on the Talkin Balls Network, and we're standing up Talkin Flag's own YouTube, Spotify, and Apple Podcasts channels. Send the IDs/links once those exist and we'll wire them in (see below).

---

## Your to-do list (the keys)

These are set in **Vercel → Project Settings → Environment Variables** (or just send the value and we'll add it). Each one turns on a feature that's already coded.

| # | Key / Action | What it turns on | Where |
|---|---|---|---|
| 1 | **`CRON_SECRET`** (any random string) | Automatic **weekly** ranking refresh + secures the Sunday digest job | Vercel env var |
| 2 | **`RESEND_API_KEY`** (+ verify talkinflag.com in Resend) | Welcome emails, contact-form copies, weekly digest, **and the new "your update is live" emails** | Resend account → Vercel env var |
| 3 | **Spotify Show ID** (`NEXT_PUBLIC_SPOTIFY_SHOW_ID`) | The audio player on `/podcast` (already built, hidden until set) | From the new Spotify channel |
| 4 | **YouTube channel + 5 video IDs** | Live episode section + the 5 interview blog embeds | From the new YouTube channel |
| 5 | **Apple Podcasts URL** | "Listen on Apple Podcasts" link | From the new Apple channel |
| 6 | **`PRINTFUL_API_KEY`** | Merch store (fully built — products appear automatically) | Printful → Vercel |
| 7 | **Amazon Associates tag** | Swap placeholder `talkinflag-20` for your real affiliate tag | Once approved |
| 8 | **Leaked-password protection** (optional) | A security best-practice toggle. *No real effect today* since sign-in is passwordless (magic link + Google), but harmless to turn on | Supabase → Authentication → Attack Protection |
| 9 | **Host photos** (if not already up) | `/about` hero — drop `hosts-hero.jpg`, `ambra.jpg`, `tika.jpg` into the site's `public/` folder | Send the files |

**Most impactful first:** #1 (`CRON_SECRET`) and #2 (`RESEND_API_KEY`) unlock the most — automatic weekly rankings and all the email loops.

---

## Decisions recorded (no action needed)

- ✅ Rankings release **weekly**, Sundays.
- ✅ Talkin Flag launches its **own** YouTube / Spotify / Apple channels; the show itself stays on the Talkin Balls Network.
- ✅ Homepage partners (Flag Football Finder, Athleads) confirmed.
- ✅ Database backup tables already cleaned up.

---

## Still parked (not started — flag if you want them prioritized)

- IQ quiz **variants** for Coaches / Experts / Players (today there's one general quiz).
- International expansion: Spanish translation + Mexico's top women's league depth (Phase G).
- Gallery redesign + TikTok embeds (need a TikTok handle).
- A couple of security best-practices (CAPTCHA on login, an extra database-policy safety net) — low priority, the site is already secure.
