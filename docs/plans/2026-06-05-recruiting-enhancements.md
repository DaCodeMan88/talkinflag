# Recruiting Enhancements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the coach view tracking feature (Feature 1) — the only remaining piece of the 1–6 enhancement set.

**Architecture:** The API route (`/api/players/[id]/view`) and `coach_profile_views` table already exist. Two things are missing: (a) the player profile page needs to call that API when a verified coach views it, and (b) the player dashboard needs to surface the weekly view count. Feature 1 uses a client component to fire the POST silently on mount, and the dashboard queries the count server-side.

**Tech Stack:** Next.js 15 App Router · TypeScript · Supabase (server + client) · Tailwind CSS

---

## Current State

| Feature | Status | Notes |
|---------|--------|-------|
| 1 — Coach view tracking | 🟡 Partial | API route + DB table exist; no trigger on profile page; no display on dashboard |
| 2 — Recruiting completeness score | ✅ Done | Dashboard completion bar fully built |
| 3 — "In Demand" badge | ⏸ Tabled | Needs coach volume first |
| 4 — Roster spots board | ✅ Done | RosterSpotsBoard component live |
| 5 — "New to Recruiting" badge | ✅ Done | newPlayerIds logic in recruit page |
| 6 — Private coach notes | ✅ Done | coach_player_notes table + UI |
| 7 — International opportunity matching | ⏸ Roadmap | Not building yet |

**Only Task 1 remains.**

---

### Task 1: Trigger view logging when a coach visits a player profile

**Files:**
- Create: `src/app/players/[id]/CoachViewTracker.tsx`
- Modify: `src/app/players/[id]/page.tsx`

**Context:** The player profile page (`/players/[id]/page.tsx`) is a Server Component. It can't fire a POST on mount directly. We need a tiny Client Component that fires the API call once on mount, rendered only when the viewer is a verified coach.

The page already fetches `user` via `supabase.auth.getUser()` (check the full file — add if not there). We need to also check if that user is a verified coach and pass a boolean to the tracker.

**Step 1: Check what the player profile page currently imports and how it gets user**

Read the full file:
```
/Users/danielharris/Desktop/Flag/talkinflag/src/app/players/[id]/page.tsx
```
Look for: does it call `createClient()` from `@/lib/supabase/server`? Does it fetch the current user?

**Step 2: Write the CoachViewTracker client component**

Create `src/app/players/[id]/CoachViewTracker.tsx`:

```tsx
"use client";
import { useEffect } from "react";

export default function CoachViewTracker({ playerId }: { playerId: string }) {
  useEffect(() => {
    fetch(`/api/players/${playerId}/view`, { method: "POST" }).catch(() => {});
  }, [playerId]);
  return null;
}
```

**Step 3: Wire it into the player profile page**

In `src/app/players/[id]/page.tsx`, at the top of the `PlayerProfilePage` function (it's an async Server Component):

1. Import `createClient` from `@/lib/supabase/server` (may already be imported)
2. Import `CoachViewTracker` from `./CoachViewTracker`
3. After fetching the player, add:

```tsx
// Check if the current user is a verified coach (for view tracking)
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
let isVerifiedCoach = false;
if (user) {
  const { data: coach } = await supabase
    .from("coaches")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_verified", true)
    .single();
  isVerifiedCoach = !!coach;
}
```

4. In the JSX return, add before the closing tag of the root div:

```tsx
{isVerifiedCoach && <CoachViewTracker playerId={player.id} />}
```

**Step 4: Verify the dev server compiles**

```bash
cd /Users/danielharris/Desktop/Flag/talkinflag && npm run build 2>&1 | tail -20
```
Expected: no TypeScript or build errors.

**Step 5: Commit**

```bash
cd /Users/danielharris/Desktop/Flag/talkinflag
git add src/app/players/\[id\]/CoachViewTracker.tsx src/app/players/\[id\]/page.tsx
git commit -m "feat: fire coach view log when verified coach visits player profile"
```

---

### Task 2: Show weekly coach view count on the player dashboard

**Files:**
- Modify: `src/app/dashboard/page.tsx`

**Context:** The dashboard already shows a profile completion bar. We add a new info card below it showing "X coaches viewed your profile this week." This is a server-side query — no new component needed.

**Step 1: Add the view count query**

In `src/app/dashboard/page.tsx`, inside the `DashboardPage` async function, after the player is fetched, add:

```tsx
let weeklyViews = 0;
if (player) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("coach_profile_views")
    .select("id", { count: "exact", head: true })
    .eq("player_id", player.id)
    .gte("last_viewed_at", sevenDaysAgo);
  weeklyViews = count ?? 0;
}
```

**Step 2: Add the display card in the JSX**

Inside the `player ? (...)` branch, after the completion bar card and before the Stat Verification card, add:

```tsx
{/* Coach views this week */}
<div className="bg-[#0d0d0d] border border-brand-white/10 p-5 flex items-center justify-between">
  <div>
    <p className="text-brand-white/60 text-sm font-display uppercase tracking-widest">
      Coach Interest
    </p>
    <p className="text-brand-white/25 text-xs mt-1">
      {weeklyViews === 0
        ? "No coach views yet this week"
        : weeklyViews === 1
        ? "1 coach viewed your profile this week"
        : `${weeklyViews} coaches viewed your profile this week`}
    </p>
  </div>
  <span className="font-display text-2xl text-brand-yellow">{weeklyViews}</span>
</div>
```

**Step 3: Verify build**

```bash
cd /Users/danielharris/Desktop/Flag/talkinflag && npm run build 2>&1 | tail -20
```
Expected: clean build.

**Step 4: Commit**

```bash
cd /Users/danielharris/Desktop/Flag/talkinflag
git add src/app/dashboard/page.tsx
git commit -m "feat: show weekly coach view count on player dashboard"
```

---

### Task 3: Deploy to Vercel

**Context:** Per memory, the last deploy was not confirmed done. These two tasks are small and deploy cleanly.

**Step 1: Confirm Vercel CLI is available**

```bash
npx vercel --version
```

**Step 2: Deploy**

```bash
cd /Users/danielharris/Desktop/Flag/talkinflag && npx vercel --prod
```

Or use the Vercel MCP tool: `deploy_to_vercel` (project: `prj_wRtnbxsJQ53KLjXlQcW4UmixhBWF`, team: `talkinflag-s-projects`).

**Step 3: Verify live site**

Visit `https://talkinflag.vercel.app/players/ab5214c7-17bf-4f63-ab38-6a6ebe1c9d2c` (Ambra's profile) and confirm it loads. Visit `/dashboard` and confirm the coach views card appears (will show 0 until a coach visits).

---

## What's Tabled

- **Feature 3 (In Demand badge):** Needs coach volume. Add when there are 10+ verified coaches actively using the platform.
- **Feature 7 (International matching):** Roadmap item. Requires `eligible_nationalities` column on players, national team coach matching logic, and dashboard UI. Not building this session.

## DB Note

The `coach_profile_views` table needs to exist with this schema. Confirm it's migrated (it was referenced in the API route). If not:

```sql
CREATE TABLE IF NOT EXISTS coach_profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  last_viewed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coach_id, player_id)
);

ALTER TABLE coach_profile_views ENABLE ROW LEVEL SECURITY;

-- Coaches can insert/update their own views
CREATE POLICY "coach_views_own" ON coach_profile_views
  FOR ALL USING (
    coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid())
  );

-- Players can read counts for their own profile (via service role in dashboard)
```

The dashboard query uses the authenticated supabase client (service role context via `createClient()`), so RLS won't block the count read for the player's own data — as long as the player's `claimed_by` matches `auth.uid()`.
