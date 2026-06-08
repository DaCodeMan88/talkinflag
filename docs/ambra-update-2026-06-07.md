# Talkin Flag — Update Email for Ambra & Tika

*Updated 2026-06-08. Plain-language version — no tech jargon. Send once the Talkin Balls partnership status is clearer (see §Before the Domain section below).*

*Live site: **https://talkinflag.vercel.app***

---

**Subject: Talkin Flag Website — Where We Are + What's Next**

---

Hi Ambra and Tika,

Here's a full picture of where the website stands, what's ready for you to use, and what we need from you to move forward. Keeping it simple — no tech stuff.

---

## ✅ What's Already Live

**The website is up and running.** Here's what's inside:

- **Homepage** — hero with both of you, latest episodes, featured athletes and plays of the week, listen/follow buttons, and a Partners section
- **Player Database** — 374+ players, fully searchable, with individual profiles and rankings
- **Rankings** — High School, College, World (with full team profiles for Italy and USA), and a national player ranking system powered by community polls
- **Podcast page** — episode grid (audio player ready, just needs your Spotify show ID)
- **Events** — a world calendar with public submissions, built-in approval workflow so nothing goes live without your okay
- **Blog** — 23+ articles including 5 interview features (Katherine Sowers, Vanita Krouch, Darrell Doucette, Amber Clark-Robinson, and a Flores piece)
- **Media / Gallery** — photo grid + Instagram embed
- **About** — both your bios and joint paragraph, exactly as you wrote them
- **Coach Directory** — verified coaching profiles with search and filters
- **Scouting / Recruiting** — tools for coaches to find players and players to get discovered
- **Community tools** — follow players, compare profiles, get notified
- **Merch store** — built and ready, just needs connecting to your Printful account
- **Admin panel** — where you manage events, verifications, rankings, featured athletes, and more

---

## 📋 Your Action Items (in order of priority)

**1. Set up your admin accounts**
Go to **https://talkinflag.vercel.app** and sign in with Google using the emails you want to use as your admin logins. Let us know both emails and we'll activate your admin access. Once you're in, you'll be able to manage everything from a single dashboard.

**2. Spotify show ID**
Log into your Spotify for Podcasters dashboard → copy the Show ID from the URL → send it over. That switches on the built-in Spotify player. Takes 2 minutes.

**3. Headshots / photos**
Send us:
- A solo photo of each of you
- One photo of you together (optional but great for the About page hero)

**4. Confirm the Partner links**
The site shows **Flag Football Finder** and **Athleads** as partners right now (placeholder links). Confirm the correct URLs — or let us know if those are wrong/outdated.

**5. Sponsor / highlight clips from socials**
You probably already have clips and promos from your episodes on Instagram or YouTube. Share those links with us and we'll feature the best moments on the website and podcast pages. This becomes a powerful content loop — short clips drive people to the full episodes.

**6. YouTube channel for the show**
Does Talkin Flag have (or could it get) its own YouTube channel separate from Talkin Balls? This would let us embed episodes directly and track the show's reach independently. Let us know — it would change how we wire up the video section of the site.

---

## ⚠️ Before We Buy the Domain — Read This First

**Hold on the domain purchase until after June 15th.**

Here's why: if the partnership agreement with the Talkin Balls network isn't finalized by that meeting, we may need to adjust the show name and remove the network ties from the site. Buying the domain before that's settled could create extra work.

**Once the deal is confirmed:**
- We recommend **talkinflag.com** (two words, cleaner)
- We'll update the whole site, email setup, and social links in one go

**If the partnership doesn't proceed:**
- We'd need to update: the show name, any "Talkin Balls Network" references on the About page and footer, and the domain decision
- This is a small change — nothing breaks, it just takes an hour to swap out

---

## 🔑 How to Access Your Admin Panel

Once your accounts are activated, here's what you can do:

1. Go to **talkinflag.vercel.app/admin**
2. You'll see a dashboard showing everything pending your approval
3. From there you can: approve/reject event submissions, review player stat verifications, manage featured athletes and top plays, and trigger a rankings update

We'll do a quick walkthrough when you're ready — it's designed to be simple. No technical knowledge needed.

---

## 🗺️ Growth Strategy — Our Thinking

Here's a bigger-picture view of how we think the platform grows. Want to discuss this together.

**Data & Player Verification**

The most important thing we can do to make the database credible is get real coaches and scouts verifying player stats. Our thinking:

- **Partner with established 1-day clinics and testing camps** — organizations already running these events are natural allies. Athletes show up, get tested, and their results go directly into the database as verified stats. Testing sessions can be organized by geographic area so athletes sign up for a session near them.
- **ALL22 connections** — their network of coaches, scouts, and resources is a natural pipeline for both verifications and recruiting leads.
- **Reach out to high school and college coaches across the U.S.** — especially coaches who are invested in growing women's and girls' flag football. Even occasional involvement (hosting or supervising a 1-day testing session, or verifying a few of their own athletes) makes a big difference.

**Geographic Expansion**

Rather than trying to do everything at once, we think a clear split works best:

- **Ambra focuses on the U.S.** — leveraging her existing connections to target college coaches, high school coaches, standout players, and decision makers within USA Football. The U.S. is the largest market and has the most infrastructure to tap.
- **Tika focuses internationally** — specifically reaching out to national team coaches and players from the countries most likely to make the Olympics. National team athletes have the most passionate fan bases globally. The goal: get as many national team coaches and players from different countries on the show as guests. Start with Italy, then work through the Olympic-bound programs.

**Content Strategy**

- **Short clips from episodes are the key** — the best moments from interviews become standalone content across Instagram and YouTube Shorts. These drive people to the full episodes and to the website. You're probably already creating this content — we just want to make sure the website is amplifying it.
- **Blog interview articles** — the five interview features already live on the site are good foundations. As you bring more guests on, each interview can become an article.
- **Rankings as a talking point** — the TF Rank (our community-powered player ranking system) gives you something no other flag football show has. "Here's who our coaches and experts ranked as the top players this week" is a strong recurring segment or social hook.

---

## 🔮 What's Still to Build

Bigger features we've mapped out for later:

- **Flag Football Fundamentals course** — educational content that brings people back to the site
- **Career-update loop** — players update their profiles when they get promoted, win championships, etc.
- **Spanish + Mexico** — translating the site and going deeper on Mexico's top women's league
- **Merch + giveaways** — the store is built, just needs connecting (Printful account)
- **Podcast review / shout-out flow** — listeners submit reviews, you feature them on the show

---

That's the full picture. Main things we need from you right now:
1. Your admin login emails (so we can activate your access)
2. Spotify show ID
3. Photos
4. Confirmation on Partner links
5. Decision on YouTube channel for the show
6. A quick call after June 15th once the Talkin Balls situation is clearer

Talk soon,
Daniel

---

*— Internal notes (not for the email) —*

**Admin setup:** Set `ADMIN_EMAILS` (comma-separated) in Vercel env vars to both Ambra's and Tika's Google login emails. Also set `ADMIN_EMAIL` (singular) to the primary one. Once set, they auto-get admin access on login — no database changes needed.

**Talkin Balls contingency:** If the partnership doesn't proceed after 6/15, changes needed are minimal — update `src/app/about/page.tsx` (remove network section), `src/components/layout/Footer.tsx` (remove network mention), and any references in `src/lib/static-posts.ts`. The domain and SEO metadata would also need updating. One focused session, nothing structural breaks.

**Domain pre-purchase checklist (do after 6/15 once name confirmed):**
- Buy domain (recommend talkinflag.com)
- Supabase: update Site URL + Redirect URLs in Auth settings
- Google Cloud Console: update Authorized Origins + Redirect URI for OAuth
- Vercel: add custom domain, update `NEXT_PUBLIC_SITE_URL` env var
- Update hardcoded `https://talkinflag.com` references in: `src/lib/seo.ts`, `src/app/sitemap.ts`, JSON-LD breadcrumbs in all page files

**Highlight clips:** The `StaticPost` type in `src/lib/static-posts.ts` can be extended with a `highlights[]` array for embedding clips + YouTube Short links directly in blog articles. Low effort once Ambra & Tika share their existing clip URLs — note for future session.

**pg_cron (nightly rankings recompute):** Available on Supabase Pro plan. If they upgrade later, configure `app.settings.site_url` and `app.settings.cron_secret` in Supabase dashboard → runs automatically at 02:00 UTC. For now, they trigger it manually from `/admin/rankings`.
