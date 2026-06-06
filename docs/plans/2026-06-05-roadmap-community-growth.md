# Talkin Flag — Community, Growth & Platform Completion Roadmap

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the recruiting platform, build community/engagement features, grow the brand through ambassador scouts, and finish with SEO + domain + merch as trailing items.

**Architecture:** Next.js 15 App Router + Supabase (Postgres + Auth + Storage) + Resend (email) + Vercel (hosting + cron). All new DB tables go through Supabase MCP `apply_migration`. All new pages follow the existing dark brand pattern (black `#000000`, yellow `#FDDD58`, white `#FFFFFF`, Anton `font-display`).

**Tech Stack:** Next.js 15 · TypeScript · Tailwind CSS v3 · Supabase · Resend · Vercel Cron · Stripe (Phase H) · Printful (Phase H)

**Project root:** `/Users/danielharris/Desktop/Flag/talkinflag/`
**Live site:** `https://talkinflag.vercel.app`
**Supabase project:** `wxeuybksowhncalrnttl`

---

## Strategic Decisions (Read Before Building)

### ✅ Followers Feature — BUILD IT

Private follow system where users follow players and coaches. Counts are never shown publicly — no social anxiety, no follower-farming. The value is entirely in the personalized weekly digest email it unlocks. This makes the newsletter feel custom-built for each user instead of a broadcast.

**Recruiting angle:** When a coach follows a player, it's a soft signal of interest — visible to coaches in their pipeline but not announced to the player. When a player follows a coach, it shows up as "a player is watching you" in the coach's dashboard (no name revealed).

**Monetization:** Premium tier (future) gets daily digests instead of weekly, and "who's following you" visibility.

### ✅ Community Forum — DISCORD FIRST, not custom

A custom forum would take 3-4 sessions to build, has a cold-start problem (empty forum = dead site), and creates moderation overhead immediately. Discord is free, proven, and Ambra + Tika can seed it with content today.

**What to BUILD on the site:** A `/community` page with a Discord embed widget + "Join the Community" CTA. Link from homepage, navbar, and relevant pages. A Claude-powered Discord bot (via Discord API) for Q&A is a Phase 2 task.

**Monetization path:** Premium Discord tier with exclusive content channels, 1:1 with Ambra/Tika, early episode access.

**Revisit custom forum** if Discord reaches 500+ active members.

### ✅ Ambassador / Stat Scout Program — BUILD THE INFRASTRUCTURE

Ambra has a partnership with All22 (tackle football testing events). The play: adapt their model for flag football. Recruit scouts — people who already attend flag football events — to host 1-2 testing sessions per year in their area, collect measurables (40-yd, vertical, height, weight) using a standardized checklist, and submit data through the Talkin Flag platform. This feeds the stat verification pipeline, expands geographic coverage, and grows brand visibility.

**Business process (owner action, not code):**
- Reach out to All22 about flag football partnership
- Identify 5-10 initial scouts from existing community (event regulars, coaches, ex-players)
- Create a branded "Scout Kit" (measurement guide, QR code to submission form, Talkin Flag merch)
- Scout benefit: merch, recognition on site, affiliate commission on verified players added

**What to BUILD on the site:**
- `/scouts/apply` — Scout application form
- `/api/scouts/apply` — Route to save application + notify admin
- `/admin/scouts` — Admin view of scout applications
- Scout data submission form (feeds `stat_verifications` with `source_type: 'scout'`)

### ⏸ SEO + Domain + Merch — LAST

Domain is a blocker for Google OAuth (currently in Testing mode), Supabase redirect URLs, and the `from:` address in Resend emails. Choose the domain first, then update 5 places (Supabase Site URL, Supabase Redirect URLs, Google Cloud OAuth origins + redirect URI, Google OAuth consent screen email, Resend `from` address in `src/lib/email.ts`). Merch depends on domain for Stripe/Printful webhook URLs.

---

## PHASE A — Platform Integrity (Next Session)

*Start here. Opens the coach card LinkedIn sharing properly and completes the recruiting loop.*

---

### Task 1: Coach Profile Edit Form

**Why:** Coaches currently can't edit wins/losses/philosophy/title/years_coaching from the UI. These fields were added to the DB but are only editable via Supabase dashboard. The share card toggles are permanently locked for all coaches until this is built.

**Files:**
- Create: `src/app/dashboard/edit-coach/page.tsx`
- Create: `src/app/dashboard/edit-coach/CoachEditForm.tsx`
- Create: `src/app/api/coaches/profile/route.ts`

**Step 1: Create the API route**

Create `src/app/api/coaches/profile/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: coach } = await supabase
    .from("coaches")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!coach) return NextResponse.json({ error: "No coach profile" }, { status: 403 });

  const body = await req.json();
  const allowed = ["title", "years_coaching", "wins", "losses", "philosophy", "bio", "website", "phone"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key] === "" ? null : body[key];
  }

  const { error } = await supabase.from("coaches").update(update).eq("id", coach.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

**Step 2: Create the form component**

Create `src/app/dashboard/edit-coach/CoachEditForm.tsx` — a `"use client"` component:

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Coach = {
  title: string | null; years_coaching: number | null; wins: number | null;
  losses: number | null; philosophy: string | null; bio: string | null;
  website: string | null; phone: string | null;
};

export default function CoachEditForm({ coach }: { coach: Coach }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: coach.title ?? "",
    years_coaching: coach.years_coaching?.toString() ?? "",
    wins: coach.wins?.toString() ?? "",
    losses: coach.losses?.toString() ?? "",
    philosophy: coach.philosophy ?? "",
    bio: coach.bio ?? "",
    website: coach.website ?? "",
    phone: coach.phone ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/coaches/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        years_coaching: form.years_coaching ? parseInt(form.years_coaching) : null,
        wins: form.wins ? parseInt(form.wins) : null,
        losses: form.losses ? parseInt(form.losses) : null,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); router.refresh(); }, 1500);
  }

  const field = (label: string, key: keyof typeof form, type = "text", hint?: string) => (
    <div>
      <label className="block text-brand-white/50 text-xs font-display uppercase tracking-widest mb-1">{label}</label>
      {hint && <p className="text-brand-white/25 text-xs mb-2">{hint}</p>}
      {key === "bio" || key === "philosophy" ? (
        <textarea
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          rows={key === "philosophy" ? 3 : 4}
          maxLength={key === "philosophy" ? 200 : 600}
          className="w-full bg-[#0d0d0d] border border-brand-white/10 text-brand-white text-sm px-3 py-2 focus:outline-none focus:border-brand-yellow/40 resize-none"
        />
      ) : (
        <input
          type={type}
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="w-full bg-[#0d0d0d] border border-brand-white/10 text-brand-white text-sm px-3 py-2 focus:outline-none focus:border-brand-yellow/40"
        />
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {field("Title", "title", "text", 'e.g. "Head Coach", "Offensive Coordinator"')}
      <div className="grid grid-cols-3 gap-4">
        {field("Years Coaching", "years_coaching", "number")}
        {field("Wins", "wins", "number")}
        {field("Losses", "losses", "number")}
      </div>
      {field("Coaching Philosophy", "philosophy", "text", "One punchy quote about your coaching approach (max 200 chars). Appears on your share card.")}
      {field("Bio", "bio", "text", "Longer bio for your public profile.")}
      {field("Website", "website", "url")}
      {field("Phone", "phone", "tel")}
      <button
        type="submit"
        disabled={saving}
        className="bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-xs py-2 px-6 hover:bg-brand-yellow/90 transition-colors disabled:opacity-50"
      >
        {saving ? "Saving..." : saved ? "✓ Saved" : "Save Changes"}
      </button>
    </form>
  );
}
```

**Step 3: Create the page**

Create `src/app/dashboard/edit-coach/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/lib/seo";
import CoachEditForm from "./CoachEditForm";

export const metadata = buildMetadata({ title: "Edit Coach Profile | Talkin Flag", description: "Update your coaching record and profile.", path: "/dashboard/edit-coach" });

export default async function EditCoachPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/dashboard/edit-coach");

  const { data: coach } = await supabase
    .from("coaches")
    .select("id, first_name, last_name, team, title, years_coaching, wins, losses, philosophy, bio, website, phone")
    .eq("user_id", user.id)
    .single();

  if (!coach) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20 px-4">
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <Link href="/dashboard/recruiting" className="text-brand-white/40 text-xs font-display uppercase tracking-widest hover:text-brand-yellow transition-colors">
            ← Back to Pipeline
          </Link>
          <div className="border-l-4 border-brand-yellow pl-6 mt-4">
            <h1 className="font-display text-4xl uppercase text-brand-white leading-none">Edit Profile</h1>
            <p className="text-brand-white/40 text-sm mt-1">{coach.first_name} {coach.last_name} · {coach.team}</p>
          </div>
        </div>
        <CoachEditForm coach={coach} />
      </div>
    </div>
  );
}
```

**Step 4: Add "Edit Profile" link to coach dashboard**

Modify `src/app/dashboard/recruiting/page.tsx` — in the header section, add a link after the coach name:

```tsx
<Link href="/dashboard/edit-coach" className="text-brand-yellow text-xs font-display uppercase tracking-widest hover:text-brand-yellow/80 transition-colors">
  Edit Profile →
</Link>
```

**Step 5: Build and verify**

```bash
cd /Users/danielharris/Desktop/Flag/talkinflag && npm run build 2>&1 | tail -15
```
Expected: clean build, `/dashboard/edit-coach` appears as `ƒ` dynamic route.

**Step 6: Commit**

```bash
git add src/app/dashboard/edit-coach/ src/app/api/coaches/profile/ src/app/dashboard/recruiting/page.tsx
git commit -m "feat: coach profile edit form (wins/losses/philosophy/title)"
```

---

### Task 2: Public Coach Profile Pages `/coaches/[id]`

**Why:** Coaches have no public URL. Their LinkedIn share card links to a dashboard page that's auth-gated. This makes the LinkedIn share useless. A public profile page gives coaches a real shareable URL.

**Files:**
- Create: `src/app/coaches/[id]/page.tsx`
- Create: `src/app/coaches/[id]/opengraph-image.tsx`

**Step 1: Create the public coach profile page**

Create `src/app/coaches/[id]/page.tsx`:

```tsx
import { createServerClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = createServerClient();
  const { data } = await supabase.from("coaches").select("first_name, last_name, team, level").eq("id", id).eq("is_verified", true).single();
  if (!data) return { title: "Coach Not Found | Talkin Flag" };
  return buildMetadata({
    title: `${data.first_name} ${data.last_name} | ${data.team} | Talkin Flag`,
    description: `Verified ${data.level?.replace("_", " ")} coach at ${data.team}. View profile on Talkin Flag.`,
    path: `/coaches/${id}`,
  });
}

export default async function CoachProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data: coach } = await supabase
    .from("coaches")
    .select("id, first_name, last_name, team, level, title, years_coaching, wins, losses, philosophy, bio, website")
    .eq("id", id)
    .eq("is_verified", true)
    .single();

  if (!coach) notFound();

  const fullName = `${coach.first_name} ${coach.last_name}`;
  const levelLabel: Record<string, string> = { college: "College", national: "National Team", high_school: "High School" };
  const record = (coach.wins != null && coach.losses != null) ? `${coach.wins}W — ${coach.losses}L` : null;

  return (
    <div className="min-h-screen bg-brand-black">
      {/* Hero */}
      <div className="relative bg-[#0a0a0a] border-b border-brand-white/10 pt-28 pb-12 overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-brand-yellow" />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-brand-yellow/5 blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/recruit" className="inline-flex items-center gap-2 text-brand-white/40 hover:text-brand-yellow text-xs font-display uppercase tracking-widest mb-8 transition-colors">
            ← Recruiting
          </Link>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-brand-yellow text-brand-black font-display uppercase text-xs px-3 py-1 tracking-wider">
                ✓ Verified Coach
              </span>
              {coach.level && (
                <span className="border border-brand-white/20 text-brand-white/60 text-xs px-3 py-1 uppercase tracking-wide font-display">
                  {levelLabel[coach.level] ?? coach.level}
                </span>
              )}
            </div>

            <h1 className="font-display text-5xl md:text-7xl uppercase text-brand-white leading-none">
              {fullName}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              {coach.title && <span className="text-brand-yellow font-display uppercase tracking-widest text-sm">{coach.title}</span>}
              {coach.team && <span className="text-brand-white/60">· {coach.team}</span>}
              {coach.years_coaching && <span className="text-brand-white/40">· {coach.years_coaching} yrs coaching</span>}
            </div>

            {record && (
              <p className="font-display text-2xl text-brand-white">{record}</p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">

        {coach.philosophy && (
          <div className="border-l-4 border-brand-yellow pl-6">
            <p className="text-brand-white/40 text-xs font-display uppercase tracking-widest mb-2">Coaching Philosophy</p>
            <blockquote className="text-brand-white text-xl italic leading-relaxed">
              &ldquo;{coach.philosophy}&rdquo;
            </blockquote>
          </div>
        )}

        {coach.bio && (
          <div>
            <p className="text-brand-white/40 text-xs font-display uppercase tracking-widest mb-3">About</p>
            <p className="text-brand-white/70 leading-relaxed">{coach.bio}</p>
          </div>
        )}

        {coach.website && (
          <div>
            <p className="text-brand-white/40 text-xs font-display uppercase tracking-widest mb-2">Website</p>
            <a href={coach.website} target="_blank" rel="noopener noreferrer" className="text-brand-yellow hover:underline text-sm">{coach.website}</a>
          </div>
        )}

        {/* CTA for players */}
        <div className="border border-brand-yellow/20 p-6 space-y-3">
          <p className="font-display text-lg uppercase text-brand-white">Interested in this coach?</p>
          <p className="text-brand-white/40 text-sm">Open your recruiting profile to connect.</p>
          <Link href="/recruit" className="inline-block bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-xs py-2 px-5 hover:bg-brand-yellow/90 transition-colors">
            View Open Spots →
          </Link>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Create OG image for coach profiles**

Create `src/app/coaches/[id]/opengraph-image.tsx`:

```tsx
import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";
export const alt = "Coach Profile | Talkin Flag";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let name = "Flag Football Coach";
  let team = "";
  let levelLabel = "";
  let record = "";
  let philosophy = "";

  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data } = await supabase.from("coaches").select("first_name, last_name, team, level, wins, losses, philosophy, title").eq("id", id).eq("is_verified", true).single();
    if (data) {
      name = `${data.first_name} ${data.last_name}`;
      team = data.team ?? "";
      const map: Record<string, string> = { college: "College", national: "National Team", high_school: "High School" };
      levelLabel = map[data.level] ?? data.level ?? "";
      if (data.wins != null && data.losses != null) record = `${data.wins}W — ${data.losses}L`;
      philosophy = data.philosophy ? `"${data.philosophy.slice(0, 80)}${data.philosophy.length > 80 ? "..." : ""}"` : "";
    }
  } catch { /* fallback */ }

  return new ImageResponse((
    <div style={{ width: "1200px", height: "630px", display: "flex", flexDirection: "column", backgroundColor: "#000000", fontFamily: "sans-serif", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "6px", backgroundColor: "#FDDD58", display: "flex" }} />
      <div style={{ position: "absolute", left: "72px", top: "60px", bottom: "60px", width: "4px", backgroundColor: "#FDDD58", display: "flex" }} />
      <div style={{ position: "absolute", bottom: "-100px", right: "-100px", width: "450px", height: "450px", borderRadius: "50%", backgroundColor: "#FDDD58", opacity: 0.07, display: "flex" }} />
      <div style={{ display: "flex", flexDirection: "column", padding: "72px 80px 72px 104px", height: "100%", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: "#FDDD58", fontSize: "15px", letterSpacing: "0.3em", textTransform: "uppercase" }}>TALKIN FLAG · VERIFIED COACH</span>
          {levelLabel && <div style={{ backgroundColor: "#FDDD58", color: "#000000", fontSize: "18px", fontWeight: 900, letterSpacing: "0.05em", padding: "6px 18px", display: "flex" }}>{levelLabel.toUpperCase()}</div>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <span style={{ color: "#FFFFFF", fontSize: name.length > 20 ? 72 : 88, fontWeight: 900, textTransform: "uppercase", lineHeight: 1.0, letterSpacing: "-0.02em" }}>{name}</span>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {team && <div style={{ backgroundColor: "#FDDD58", color: "#000000", fontSize: "20px", fontWeight: 700, letterSpacing: "0.05em", padding: "4px 14px", display: "flex" }}>{team}</div>}
            {record && <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "22px", letterSpacing: "0.05em" }}>{record}</span>}
          </div>
          {philosophy && <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "18px", fontStyle: "italic", maxWidth: "800px" }}>{philosophy}</span>}
        </div>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "16px", textTransform: "uppercase", letterSpacing: "0.2em" }}>Coach Profile · talkinflag.com/coaches</span>
      </div>
    </div>
  ), { ...size });
}
```

**Step 3: Update CoachShareCard to use real public URL**

Modify `src/app/dashboard/recruiting/CoachShareCard.tsx`. Find where it builds the copy/LinkedIn URL (currently hardcoded to `/dashboard/recruiting`) and change it to use the coach's public profile URL.

The `CoachShareCard` component doesn't currently receive the `coachId`. You need to:
1. Add `coachId: string` to the Props type
2. Build the URL as `` `/coaches/${coachId}` ``
3. Pass `coachId={coach.id}` from the recruiting dashboard page

**Step 4: Build and verify**

```bash
cd /Users/danielharris/Desktop/Flag/talkinflag && npm run build 2>&1 | tail -15
```
Expected: `/coaches/[id]` and `/coaches/-/opengraph-image` appear in build output.

**Step 5: Commit**

```bash
git add src/app/coaches/[id]/ src/app/dashboard/edit-coach/
git commit -m "feat: public coach profile pages + coach profile edit form"
```

---

### Task 3: Homepage Live Data (#16)

**Why:** StatsBar shows hardcoded numbers. PlayersSpotlight and EventsTeaser show static/stale data. The site should feel alive — real counts, real featured players, real upcoming events.

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/home/StatsBar.tsx`
- Modify: `src/components/home/PlayersSpotlight.tsx`
- Modify: `src/components/home/EventsTeaser.tsx`

**Step 1: Read the current homepage**

Read `src/app/page.tsx` fully. Understand what props StatsBar, PlayersSpotlight, and EventsTeaser currently accept.

**Step 2: Add live data fetches to homepage**

In `src/app/page.tsx`, after the `getEpisodes` call, add:

```ts
import { createServerClient } from "@/lib/supabase";
// inside the page function:
const supabase = createServerClient();
const [
  { count: playerCount },
  { count: coachCount },
  { count: episodeCountFromDB }, // fallback if YouTube API key not set
  { data: featuredPlayers },
  { data: upcomingEvents },
] = await Promise.all([
  supabase.from("players").select("id", { count: "exact", head: true }),
  supabase.from("coaches").select("id", { count: "exact", head: true }).eq("is_verified", true),
  supabase.from("players").select("id", { count: "exact", head: true }), // placeholder
  supabase.from("players")
    .select("id, first_name, last_name, position, school_or_team, photo_url, ranking_national, is_verified, level, country_code")
    .or("is_verified.eq.true,ranking_national.not.is.null")
    .order("ranking_national", { ascending: true, nullsFirst: false })
    .limit(6),
  supabase.from("events")
    .select("id, title, start_date, city, country, level, event_type")
    .gte("start_date", new Date().toISOString().split("T")[0])
    .order("start_date", { ascending: true })
    .limit(3),
]);
```

Pass these as props to the relevant components.

**Step 3: Update StatsBar to accept live counts**

Read `src/components/home/StatsBar.tsx`. Change the hardcoded numbers to accept props: `playerCount`, `coachCount`, `episodeCount`.

**Step 4: Update PlayersSpotlight to accept live player data**

Read `src/components/home/PlayersSpotlight.tsx`. Change it to accept a `players` prop array instead of fetching statically.

**Step 5: Update EventsTeaser to accept live events**

Read `src/components/home/EventsTeaser.tsx`. Same pattern — accept `events` prop.

**Step 6: Build and verify**

```bash
cd /Users/danielharris/Desktop/Flag/talkinflag && npm run build 2>&1 | tail -10
```

**Step 7: Commit**

```bash
git add src/app/page.tsx src/components/home/
git commit -m "feat: homepage live player/coach/event counts from Supabase"
```

---

## PHASE B — Followers + Personalized Newsletter (Session After Phase A)

*The single highest-retention feature. Turns the newsletter from a broadcast into something personal.*

---

### Task 4: Follows DB Schema

**Step 1: Apply migration via Supabase MCP**

Use the Supabase MCP tool `apply_migration` with project `wxeuybksowhncalrnttl`:

```sql
CREATE TABLE IF NOT EXISTS user_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followee_type text NOT NULL CHECK (followee_type IN ('player', 'coach')),
  followee_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_user_id, followee_type, followee_id)
);

ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Users can manage their own follows
CREATE POLICY "own_follows" ON user_follows FOR ALL
  USING (follower_user_id = auth.uid());

-- Coaches can see aggregate follow counts for players they're interested in (anonymous)
-- No policy needed — counts served via service role in API
```

**Step 2: Commit migration file**

```bash
git add supabase/migrations/
git commit -m "feat: user_follows table for private follow system"
```

---

### Task 5: Follow API Routes

**Files:**
- Create: `src/app/api/follows/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { followee_type, followee_id } = await req.json();
  if (!["player", "coach"].includes(followee_type) || !followee_id) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  await supabase.from("user_follows").upsert(
    { follower_user_id: user.id, followee_type, followee_id },
    { onConflict: "follower_user_id,followee_type,followee_id", ignoreDuplicates: true }
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { followee_type, followee_id } = await req.json();
  await supabase.from("user_follows")
    .delete()
    .eq("follower_user_id", user.id)
    .eq("followee_type", followee_type)
    .eq("followee_id", followee_id);
  return NextResponse.json({ ok: true });
}
```

---

### Task 6: Follow Buttons on Player + Coach Profiles

**Files:**
- Create: `src/components/ui/FollowButton.tsx`
- Modify: `src/app/players/[id]/page.tsx` — add FollowButton
- Modify: `src/app/coaches/[id]/page.tsx` — add FollowButton

`FollowButton` is a client component. It receives `followeeType`, `followeeId`, `initialFollowing` (bool, server-computed), and `isOwnProfile` (bool — don't show on your own profile).

If not logged in: clicking redirects to `/auth/login?next=current-path`.
Appearance: outline yellow button, "Follow" / "Following ✓". No follower count shown anywhere.

---

### Task 7: Dashboard "Following" Section

**Files:**
- Modify: `src/app/dashboard/page.tsx`

Add a new card below the existing cards showing who this user follows:
- List of followed players (name, position, school, link to profile)
- List of followed coaches (name, team, link to /coaches/[id])
- "Manage" link or inline unfollow buttons
- Empty state: "Follow players and coaches to get personalized weekly updates."

Server-side query in the dashboard page:
```ts
const { data: follows } = await supabase
  .from("user_follows")
  .select("followee_type, followee_id, created_at")
  .eq("follower_user_id", user.id)
  .order("created_at", { ascending: false });

// Separate into player vs coach IDs, then fetch names
```

---

### Task 8: Weekly Digest Email (Vercel Cron)

**Files:**
- Create: `src/app/api/cron/weekly-digest/route.ts`
- Modify: `vercel.json` (add cron config)

The cron runs every Monday at 9am UTC. For each user who has follows:
1. Check what changed in the past 7 days for their followed profiles:
   - Followed player: new approved stat verifications, recruiting toggled on/off
   - Followed coach: new roster spots posted
2. If there are any updates, send a personalized email via Resend
3. Use service role key (not anon) to query across users

```ts
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/weekly-digest",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

The cron route must verify `Authorization: Bearer ${CRON_SECRET}` header (set `CRON_SECRET` in Vercel env vars — Vercel passes it automatically for protected crons).

---

## PHASE C — Ambassador / Scout Program (Session 3 or 4)

*Grows data quality and brand reach. All22 partnership angle — adapt tackle football testing events for flag.*

---

### Task 9: Scout Application Form

**Files:**
- Create: `src/app/scouts/apply/page.tsx`
- Create: `src/app/scouts/apply/ScoutApplyForm.tsx`
- Create: `src/app/api/scouts/apply/route.ts`
- DB migration: `scout_applications` table

**DB Schema:**
```sql
CREATE TABLE IF NOT EXISTS scout_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  city text,
  state text,
  country text DEFAULT 'USA',
  flag_football_experience text,  -- brief description
  events_attended text,           -- which events they go to
  availability text,              -- how often they can host
  motivation text,                -- why they want to be a scout
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now()
);
```

The form collects all these fields. On submit → POST `/api/scouts/apply` → saves to DB + sends admin notification email to `daniel@dubsportsentertainment.com`.

The page should explain the scout program:
- What scouts do: host 1-2 testing events per year in their area, collect measurables (40-yd, vertical, height, weight) using the Talkin Flag standardized checklist
- What they get: branded scout kit, Talkin Flag recognition on the site, early access to platform features
- All22 partnership mention: "In partnership with All22"

---

### Task 10: Admin Scout Dashboard

**Files:**
- Create: `src/app/admin/scouts/page.tsx`
- Create: `src/app/api/admin/scouts/[id]/route.ts`

Same pattern as `/admin/verifications` — gated to `daniel@dubsportsentertainment.com`. Lists pending applications, approve/reject with PATCH route.

On approval: send welcome email to scout with the testing checklist (Resend) and instructions on how to submit player data.

---

### Task 11: Scout Data Submission

**Files:**
- Create: `src/app/scouts/submit/page.tsx`
- Create: `src/app/api/scouts/submit/route.ts`

Approved scouts (gated by checking scout_applications status='approved' for their user_id) can submit player measurements. The submission form:
- Player first/last name + position + school + grad year (for matching to existing player or creating new)
- Measurements: height (ft/in), weight, 40-yard, vertical
- Event name + date + location
- Photo (optional)

On submit → inserts into `stat_verifications` with `source_type: 'scout'` for each measurement → creates player record if no match found → notifies admin.

---

## PHASE D — Content & SEO (Session 4 or 5)

### Task 12: Episode Detail Page Enrichment (#15)

**Current state:** `/episodes/[id]/page.tsx` exists but shows minimal info (title, thumbnail, video player). No show notes, no guest bio, no related players.

**What to add:**
- Full description from YouTube API (already in the episode object)
- "About this episode" section with formatted description
- Guest name (already parsed in YouTube lib — check `src/lib/youtube.ts` for `guestName` field)
- Related players section: query Supabase for players whose name appears in the episode title/description
- Related blog posts: match by topic tags
- Share button (already exists as `ShareButton` component)
- LinkedIn share for episodes

Read `src/lib/youtube.ts` and `src/components/episodes/EpisodeCard.tsx` before modifying.

### Task 13: Events Page Improvements (#11)

**Files:** `src/app/events/page.tsx`, `src/app/events/[id]/page.tsx`

Add: level filter (youth/high school/college/national/international), event type filter, "Add to Calendar" button (generates .ics file at `/api/events/[id]/calendar`).

---

## PHASE E — Community (Discord Integration)

*Zero build time for the platform. Ambra + Tika start a Discord server. The website adds a CTA.*

### Task 14: Community Page + Discord CTA

**Files:**
- Create: `src/app/community/page.tsx`

A simple page explaining the community — who it's for (players, coaches, fans of flag football), what happens there (discussions, Q&A with Ambra + Tika, recruiting tips, event announcements). Big "Join on Discord" button linking to the Discord server invite URL.

Add to homepage (`src/app/page.tsx`) between rankings and blog sections: a brief community CTA card.
Add to navbar (`src/components/layout/Navbar.tsx`): "Community" link.

**Business action (owner):** Create Discord server. Set up channels: #general, #recruiting, #player-profiles, #coaching-tips, #events, #podcast-discussion. Ambra + Tika as admins. Post invite link in Vercel env var `NEXT_PUBLIC_DISCORD_URL`.

---

## PHASE F — Domain + SEO Finalization (Owner Actions + 1 Session)

**Owner must do first:**
1. Choose domain: `talkinflag.com` recommended (shorter, cleaner)
2. Purchase domain
3. Update in 5 places:
   - Supabase Dashboard → Project Settings → Authentication → Site URL: `https://talkinflag.com`
   - Supabase Dashboard → Authentication → URL Configuration → Redirect URLs: `https://talkinflag.com/auth/callback`
   - Google Cloud Console → OAuth → Authorized JavaScript origins: add `https://talkinflag.com`
   - Google Cloud Console → OAuth → Authorized redirect URIs: add `https://talkinflag.com/auth/callback`
   - Google Cloud Console → OAuth consent screen → Publish app (move from Testing to Production)
4. Update `src/lib/email.ts` `from` address: change `noreply@talkinflag.vercel.app` → `noreply@talkinflag.com` (requires Resend domain verification)
5. Set `RESEND_API_KEY` + `CONTACT_EMAIL_TO=talkinflagshow@gmail.com` in Vercel env vars

**Then build:**
- Update all hardcoded `talkinflag.vercel.app` URLs in `src/lib/seo.ts` and any JSON-LD scripts → `talkinflag.com`
- Add `sitemap.xml` domain update
- Add Vercel domain alias

---

## PHASE G — Merch Store (After Domain Finalized)

**Files:**
- Modify: `src/app/merch/page.tsx` (currently a placeholder)
- Create: `src/app/api/checkout/route.ts` (may already exist — check)
- Stripe + Printful wiring

**Prerequisites:** Domain live, Stripe account set up, Printful account connected with Talkin Flag designs uploaded.

Products to launch with: branded t-shirt (TKF2.PNG horizontal logo), snapback hat (circle logo), sticker pack.

---

## Summary: Session Priorities

| Session | What to Build | Files Touched |
|---------|--------------|---------------|
| **Next** | Phase A: Coach edit form + public coach profiles + homepage live data | 8-10 files |
| **Session +2** | Phase B: Followers + digest email | 6-8 files + DB migration |
| **Session +3** | Phase C: Scout program (apply + admin + submit) | 8 files + DB migration |
| **Session +4** | Phase D+E: Episode pages + Discord community page | 4-5 files |
| **After domain** | Phase F: Domain migration + SEO | Config updates |
| **Last** | Phase G: Merch store | 2-3 files |

---

## Context for New Sessions

**Project root:** `/Users/danielharris/Desktop/Flag/talkinflag/`
**Supabase project:** `wxeuybksowhncalrnttl`
**Live:** `https://talkinflag.vercel.app`
**Admin email:** `daniel@dubsportsentertainment.com`
**Brand:** Black `#000000` / Yellow `#FDDD58` / White `#FFFFFF` · Anton (`font-display`) + Inter · All UI dark theme
**Email:** Resend via `src/lib/email.ts` `sendEmail()` function
**Auth:** Supabase Auth — `createClient()` from `@/lib/supabase/server` (authenticated), `createServerClient()` from `@/lib/supabase` (public/anon)
**Supabase join type issue:** Always cast with `as unknown as YourType[]` — Supabase returns array for joins, TypeScript expects object
**Deploy:** `npx vercel deploy --prod --yes` from project root
