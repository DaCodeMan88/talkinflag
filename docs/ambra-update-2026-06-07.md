# Talkin Flag — Website Update

*Draft email to Ambra & Tika — review, tweak the tone, and send. Live site: https://talkinflag.vercel.app*

---

Hi Ambra (and Tika),

Quick update on where the Talkin Flag website stands, what I need from you two, and what's still to be decided. I went through all of your meeting notes and folded them into the site — most of it is already live.

## ✅ What we have (live now)

The site is up at **talkinflag.vercel.app** with:

- **Home** — hero with both of you, latest episodes, featured athlete, top plays, listen/follow links, and (new) a **Partners** strip.
- **Players & Rankings** — a searchable database of ~374 players plus High School, College, and World rankings (with full team profiles for Italy & USA).
- **Podcast** — episode grid with a built-in Spotify player (just needs your show ID to switch on).
- **Events** — a world calendar with public event submission, now with an **approval step** so nothing goes live until we okay it (more below).
- **Blog** — 23+ articles, including 5 interview features (Katherine Sowers, Amber Clark-Robinson, Vanita Krouch, Darrell Doucette, and a Flores piece).
- **Media / Gallery** — photo grid + embedded Instagram posts.
- **About** — both your bios (using the exact text you sent), your Instagram links (@ambramarcucci, @fit_with_tika), and a joint closing paragraph. Plus a "Part of The Talkin Balls Network" section.
- **Player profiles** — free to claim, as we agreed (we can add premium features later).
- Contact email shown: **talkinflagshow@gmail.com**.

### New this week
- **Events approval workflow** — submitted events now wait in an admin queue until approved. I can approve them weekly/every-few-weeks like you suggested, and reject ones that don't fit — with an automatic, polite **rejection email** to whoever submitted it (we now ask for their email on the form).
- **About page** — added your joint closing paragraph ("Together, Ambra and Tika leverage their academic and athletic backgrounds…").
- **Partners** — added a Partners section on the homepage featuring Flag Football Finder and Athleads (placeholder links for now — see below).

## 🙏 What I need from you two

A few things will unlock features that are already built and waiting:

1. **Headshots** — a solo photo of each of you (and ideally one twin photo) so your bio cards and the About hero look their best.
2. **Spotify show ID** — from your Spotify for Podcasters dashboard, so the "Listen on Spotify" player turns on.
3. **Confirm the Partner links** — what URLs should Flag Football Finder and Athleads point to? (And are there others you want listed?)
4. **Domain decision** — talkinflag.com or talkinflagshow.com? Once you pick, I'll wire it up.
5. **The "100-point" ranking formula** — when you and Tika are ready to define how coaches/experts/stats are weighted, that unlocks the Talkin Flag ranking score (our "better than MaxPreps" feature).
6. *(On my side)* a handful of service keys/settings I'll handle in the background — email sending, YouTube, merch — to flip on the contact form, live episodes, the merch store, and the new rejection emails.

## 🤔 Decisions still to make (from your notes)

- **"Talkin Flag" vs "Talkinflag"** — I'd suggest **"Talkin Flag"** (two words), which is what we use everywhere now. Okay to lock that in?
- **Google AdSense on Rankings & Blog** — I'd hold off until we have more traffic (and we need to be approved by AdSense first). Easy to add when the time comes. Agree?
- **Talkin Balls links** — you asked about linking to talkinballsnetwork.com on the homepage and adding the network's Instagram handles (@talkinballsnetwork, @talkinballsnfl, @talkincollege, @talkinfantasyfootball) in the footer. Quick to do — just confirm and I'll add them.
- **Partners section** — I've put a placeholder live; confirm the partners + links (or tell me to pull it).
- **Events review cadence** — weekly or every couple of weeks works; the queue and rejection email are ready whenever you want to start.

## 🗺️ Still to be planned (the roadmap)

The bigger build items we've mapped out for the months ahead:

- **Highlight-clip blog posts + YouTube Shorts** — turn episode moments into shareable, monetizable clips.
- **Flag Football IQ quizzes** — fun funnels for hosts, coaches, experts, and players.
- **Weighted polls** — Coaches / Experts / Hosts vote, weighted by experience and results.
- **The Talkin Flag ranking algorithm** — combines polls + verified stats into player/team scores.
- **Flag Football Fundamentals course** — educational content that brings people back.
- **Career-update loop** — players update profiles when they win, get promoted, etc.
- **Spanish translation + Mexico's top women's league** — making the brand truly global.

And the "for later" ideas from your notes: **merch + giveaways** (the store is built, just needs connecting), a **podcast review / shout-out** flow, and a **"request a collab / podcast"** button for brands to reach us.

That's the state of play. Tell me your calls on the decisions above and send over the photos + Spotify ID whenever you can, and I'll keep moving.

Talk soon,
Daniel

---

*Internal note (not for the email): admin pages use two different env vars — `ADMIN_EMAIL` (singular, used by the existing admin home) and `ADMIN_EMAILS` (plural, used by the scouts page and the new events queue/approve route). Set BOTH in Vercel to the same address(es) so every admin surface authorizes the same accounts. Also a future hardening follow-up: the `events` table has RLS enabled but no policies, so the `is_approved` read filters in the app are the only approval gate — consider an RLS policy (`is_approved = true` for anon) as defense-in-depth.*
