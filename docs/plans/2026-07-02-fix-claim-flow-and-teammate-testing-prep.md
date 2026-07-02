# Fix Claim/Profile/Photo Flow + Teammate-Testing Prep — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix a verified live bug where claiming a profile, editing a profile, and uploading a photo all silently fail (RLS blocks the write, but the UI reports success) — this is the exact flow Ambra & Tika want a few teammates to exercise this week — and give them the short list of non-code owner actions needed first.

**Architecture:** The `players` table has RLS **enabled with zero policies** (by design — every other table in this app is read/written through a server route using the **service-role** client, e.g. `src/lib/eval/admin-client.ts`'s `createAdminClient()` or `src/lib/supabase.ts`'s `createServerClient()`). Three call sites never got the memo and read/write `players` through the **anon/cookie-bound** client (`src/lib/supabase/client.ts` or `src/lib/supabase/server.ts`), which RLS silently blocks:
1. `ClaimButton.tsx` — updates `players` directly from the browser (anon key).
2. `/api/players/[id]/profile` (PATCH) — reads+writes `players` via the cookie client.
3. `/api/players/[id]/photo` (POST) — same, for the ownership check + `photo_url` write.
4. `src/app/dashboard/page.tsx` — reads the signed-in user's claimed player via the cookie client.

Verified against the live Supabase project (`wxeuybksowhncalrnttl`): Ambra's and Tika's own seeded profiles both still show `is_claimed=false`, `claimed_by=null`, `updated_at` frozen at the original 2026-06-04/05 seed timestamp — confirming nobody has ever successfully claimed or edited a profile through the live app. This must be fixed before any teammate tries it, or they'll get a "Profile claimed successfully!" toast and then see an empty dashboard.

Fix pattern: keep the cookie client only for `supabase.auth.getUser()` (it's the only client that can read the session); do every `players` table read/write with the service-role client, with the route enforcing ownership manually (`claimed_by === user.id`) — exactly the pattern already used correctly in `/api/career-updates/submit`.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (Postgres + RLS + Storage), Vitest.

---

## Execution status (updated 2026-07-02, mid-session pause)

Running via `superpowers:subagent-driven-development` in worktree `.worktrees/fix-claim-flow` (branch `fix-claim-flow`, based off `main` @ `e582e60`).

- ✅ **Task 1 — DONE.** Commits `cc508d8` (implementation) + `84d827c` (added missing `console.error` on the 500 path per code review). Spec-compliance review: ✅ pass. Code-quality review: **approve with fixes** — the one Important finding (missing error logging) was fixed and applied directly (not re-reviewed by a fresh subagent — a 4-line, unambiguous, low-risk logging addition; judgment call to save a round-trip). Two Minor suggestions from that review were **not** applied (client/service naming convention, 409 vs 404 ambiguity, no rate limiting) — left as-is, low priority, listed below as optional follow-ups.
- ⏳ **Tasks 2–5 — NOT STARTED.**
- 🆕 **Task 6 — NEW, discovered during Task 1's code-quality review, not in original scope:** `src/app/api/players/[id]/verify/route.ts` has the *same bug class* — its `players`-table ownership-check `.select(...).single()` uses the anon/cookie client (`createClient` from `@/lib/supabase/server`), which RLS blocks (zero policies on `players`), so the route returns `403 Forbidden` for every real user, always. Verified live: `players` RLS has 0 policies confirmed via direct SQL query against project `wxeuybksowhncalrnttl`. Fix: same pattern as Tasks 1–4 — swap that one SELECT to the service-role client (`createServerClient` from `@/lib/supabase`), auth check stays on the cookie client. Full current file is in the worktree at that path; the fix is a 2-line change (import + swap `supabase` → `db` for that one query) — do **not** touch the `stat_verifications` insert further down (that table has its own RLS policy per the June session notes — verify it still authorizes `claimed player can insert` before assuming it's fine, but it's not blocked by the same zero-policy issue as `players`).

**Not yet done, still accurate from the original plan:** Owner Actions below, Tasks 2–5, and the teammate test script at the bottom.

---

## ⚠️ Owner Actions Needed (not code — do these in parallel)

1. **YouTube — wire the new channel.** You sent: handle `@TalkinFlagShow`, channel ID `UCLzmtrmZRQ7JLjjoOeZaj-Q`. Set Vercel env var `YOUTUBE_CHANNEL_ID=UCLzmtrmZRQ7JLjjoOeZaj-Q` (replaces the old Talkin Balls Network channel ID). This alone won't make live episodes appear yet — `YOUTUBE_API_KEY` (Google Cloud Console) is still needed; without it the site shows placeholder mock episodes, which is harmless for teammates testing profiles/claim.
2. **Spotify — still need the actual Show ID, not just the name.** "Talkin Flag Show" is the display name; the `NEXT_PUBLIC_SPOTIFY_SHOW_ID` env var needs the ID segment from the show's URL in Spotify for Podcasters (`https://open.spotify.com/show/<THIS_PART>`). I checked — the show isn't indexed publicly yet (too new), so I can't look it up for you. Grab it from the Spotify for Podcasters dashboard → your show → Share → copy link.
3. **Confirm `ADMIN_EMAILS` / `ADMIN_EMAIL`** are still set to `talkinflagshow@gmail.com` in Vercel. You'll want admin access during the teammate test to review anything they submit (new player profiles via "Submit a Player," career updates, coach applications).
4. **Optional, not blocking:** `RESEND_API_KEY` is still not set, so teammates won't get a "welcome" email on first login — the in-app `/welcome` tour still works fine without it.

---

## Task 1: Add a real claim API route (service-role, ownership-checked)

**Files:**
- Create: `src/app/api/players/[id]/claim/route.ts`
- Modify: `src/app/auth/claim/[id]/ClaimButton.tsx`

**Step 1: Write the route**

```typescript
// src/app/api/players/[id]/claim/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServerClient();

  const { data: updated, error } = await db
    .from("players")
    .update({
      is_claimed: true,
      claimed_by: user.id,
      claimed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("is_claimed", false) // race guard — no-op if already claimed
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  if (!updated) return NextResponse.json({ error: "This profile has already been claimed." }, { status: 409 });

  return NextResponse.json({ ok: true });
}
```

**Step 2: Rewrite `ClaimButton.tsx` to call the route instead of touching Supabase directly**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ClaimButton({
  playerId,
  playerName,
}: {
  playerId: string;
  playerName: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleClaim() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/auth/login?claim=${playerId}`);
      return;
    }

    const res = await fetch(`/api/players/${playerId}/claim`, { method: "POST" });
    const json = await res.json().catch(() => ({}));

    setLoading(false);

    if (!res.ok) {
      setError(json.error || "Something went wrong. Please try again.");
    } else {
      router.push(`/dashboard?claimed=${playerId}`);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-900/30 border border-red-500/30 text-red-400 text-sm px-4 py-3">
          {error}
        </div>
      )}
      <button
        onClick={handleClaim}
        disabled={loading}
        className="w-full bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm py-3 px-6 hover:bg-brand-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && (
          <span className="animate-spin border-2 border-brand-black border-t-transparent rounded-full w-4 h-4" />
        )}
        Yes, Claim {playerName}&apos;s Profile
      </button>
    </div>
  );
}
```

**Step 3: Build check**

Run: `npm run build`
Expected: succeeds, no type errors.

**Step 4: Commit**

```bash
git add src/app/api/players/[id]/claim/route.ts src/app/auth/claim/[id]/ClaimButton.tsx
git commit -m "fix(claim): claim a profile through a service-role API route (was silently blocked by RLS)"
```

---

## Task 2: Fix `/api/players/[id]/profile` to use the service-role client for the `players` table

**Files:**
- Modify: `src/app/api/players/[id]/profile/route.ts`

**Step 1: Swap the `players` SELECT and UPDATE to the service-role client**

Keep `createClient()` (cookie client) only for `auth.getUser()`. Add the service-role import and use `db` for both the ownership-check SELECT and the final UPDATE:

```typescript
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authClient = await createClient();

  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServerClient();

  const { data: player } = await db
    .from("players")
    .select("id, claimed_by, is_claimed, stats")
    .eq("id", id)
    .single();

  if (!player || !player.is_claimed || player.claimed_by !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ...unchanged body-parsing logic...

  const { error } = await db
    .from("players")
    .update({ ...identity, stats: mergedStats })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
```

(Everything between the ownership check and the final `.update()` — the field parsing/validation — stays exactly as it is today; only the two `supabase.from("players")` calls become `db.from("players")`.)

**Step 2: Build check**

Run: `npm run build`
Expected: succeeds.

**Step 3: Commit**

```bash
git add src/app/api/players/[id]/profile/route.ts
git commit -m "fix(profile): read/write players table via service-role client (was RLS-blocked)"
```

---

## Task 3: Fix `/api/players/[id]/photo` the same way

**Files:**
- Modify: `src/app/api/players/[id]/photo/route.ts`

**Step 1: Swap only the `players` table SELECT + final UPDATE to the service-role client**

Leave `authClient` (the cookie client) in place for `auth.getUser()` **and** for all `.storage.from("player-photos")` calls — the storage bucket already has correct RLS policies (`player_photos_owner_insert`/`_delete`, verified live) that check `players.claimed_by = auth.uid()`, so those need the real user JWT context, not service-role. Only the plain `players` table calls need the swap:

```typescript
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authClient = await createClient();

  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServerClient();

  const { data: player } = await db
    .from("players")
    .select("id, claimed_by, is_claimed")
    .eq("id", id)
    .single();

  if (!player || !player.is_claimed || player.claimed_by !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ...unchanged file validation...

  // Storage calls stay on authClient (needs auth.uid() for the storage RLS policy):
  await authClient.storage.from("player-photos").remove([...]);
  const { error: uploadError } = await authClient.storage.from("player-photos").upload(...);
  // ...
  const { data: { publicUrl } } = authClient.storage.from("player-photos").getPublicUrl(path);

  const photoUrl = `${publicUrl}?t=${Date.now()}`;

  await db.from("players").update({ photo_url: photoUrl }).eq("id", id);

  return NextResponse.json({ photo_url: photoUrl });
}
```

**Step 2: Build check**

Run: `npm run build`
Expected: succeeds.

**Step 3: Commit**

```bash
git add src/app/api/players/[id]/photo/route.ts
git commit -m "fix(photo): players table ownership check + photo_url write via service-role client"
```

---

## Task 4: Fix the dashboard's claimed-player lookup

**Files:**
- Modify: `src/app/dashboard/page.tsx`

**Step 1: Read the signed-in user's claimed player via the service-role client instead of the cookie client**

The page already imports `createAdminClient` from `@/lib/eval/admin-client` (used lower down for `eval_responses`/`iq_best`) — reuse that same service-role client for the `players` query instead of `supabase` (the cookie client):

```typescript
const supabase = await createClient(); // still used for auth.getUser() + coaches read
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect("/auth/login?next=/dashboard");

const { claimed, tour } = await searchParams;

const db = createAdminClient();

const [{ data: player }, { data: coachApp }] = await Promise.all([
  db
    .from("players")
    .select("id, first_name, last_name, position, team, level, photo_url, bio, instagram, highlight_url, height_in, weight_lbs, stats, school_or_team, country, is_verified")
    .eq("claimed_by", user.id)
    .eq("is_claimed", true)
    .maybeSingle(),
  supabase
    .from("coaches")
    .select("id, status, is_verified, first_name, last_name, team")
    .eq("user_id", user.id)
    .maybeSingle(),
]);
```

`createAdminClient()` is currently instantiated further down the file (near the `eval_responses`/`iq_best` reads) — move that line up so it's defined before this `Promise.all`. Leave the later `weeklyViews` query on `coach_profile_views` as-is on the cookie client — verified live, that table already has a working `cpv_player_select` policy, so it isn't affected by this bug.

**Step 2: Build check**

Run: `npm run build`
Expected: succeeds.

**Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "fix(dashboard): read claimed player via service-role client (was RLS-blocked)"
```

---

## Task 5: End-to-end verification against the live database

There's no staging environment for this project — verification has to happen against the real `wxeuybksowhncalrnttl` Supabase project and either a Vercel preview deploy or `npm run dev` pointed at it. Use a throwaway/unimportant unclaimed player, **not** Ambra's or Tika's own profile, and leave the database clean afterward.

**Step 1: Deploy or run locally**

Push the branch (Vercel will build a preview deploy), or run `npm run dev` locally with `.env.local` pointed at the same Supabase project.

**Step 2: Pick a throwaway test target**

Query for an unclaimed, non-notable player to use as the test subject:
```sql
select id, first_name, last_name from players where is_claimed = false and stats->>'source' = 'flagsonly' limit 1;
```

**Step 3: Walk the flow with your own email**

1. Sign in (magic link or Google) with an email that has no existing claim.
2. Go to `/players/[id]` for the test player from Step 2, click "Is this you? Claim Profile" → confirm.
3. Confirm you land on `/dashboard?claimed=<id>` and the dashboard now actually shows "Your Profile" with that player's name (this is the part that was silently failing before).
4. Go to `/dashboard/edit`, change the bio, save. Reload `/dashboard` and confirm the new bio persisted.
5. Upload a photo on `/dashboard/edit`. Confirm it appears on the public `/players/[id]` page.

**Step 4: Verify in the DB and clean up**

```sql
select id, is_claimed, claimed_by, bio, photo_url from players where id = '<test player id>';
-- confirm is_claimed=true, claimed_by=<your test user id>, bio/photo_url updated

-- clean up so the test player goes back to unclaimed for real use:
update players set is_claimed = false, claimed_by = null, claimed_at = null, bio = null, photo_url = null where id = '<test player id>';
```

**Step 5: Commit note**

No code change here — this is the manual verification gate. Note the result in `docs/plans/2026-07-02-fix-claim-flow-and-teammate-testing-prep.md` (this file) or in the next session's memory once done.

---

## Task 6: Fix `/api/players/[id]/verify` (same RLS bug, found during Task 1 review)

**Files:**
- Modify: `src/app/api/players/[id]/verify/route.ts`

**Step 1: Swap the `players` ownership-check SELECT to the service-role client**

Same pattern as Tasks 1–4: keep `createClient()` (cookie client) only for `auth.getUser()`; add `createServerClient` from `@/lib/supabase` and use it for the one `players` query.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@/lib/supabase";

// ...
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authClient = await createClient();

  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServerClient();

  const { data: player } = await db
    .from("players")
    .select("id, claimed_by, is_claimed, stats, height_in, weight_lbs")
    .eq("id", id)
    .single();

  if (!player || !player.is_claimed || player.claimed_by !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ...rest of the file (stat_key/source_type validation, stat_verifications
  // existing-check and insert) stays exactly as-is — leave those on the
  // original `supabase` (cookie) client for now unless testing shows they're
  // also blocked; `stat_verifications` reportedly has its own RLS policy
  // separate from `players`, so verify before changing it.
}
```

**Step 2: Build check**

Run: `npm run build`
Expected: succeeds.

**Step 3: Commit**

```bash
git add src/app/api/players/[id]/verify/route.ts
git commit -m "fix(verify): read players ownership check via service-role client (was RLS-blocked)"
```

**Step 4: Manual verification**

Same live-DB approach as Task 5 — claim a throwaway test player (Task 5 should already have this pattern working), add a stat, submit it for verification via `/dashboard/verify`, confirm it lands in `stat_verifications` with `status='pending'` instead of 403ing. Clean up the test row after (`delete from stat_verifications where player_id = '<test player id>';`).

---

## After this ships — teammate test script (share with Ambra & Tika)

Once Tasks 1–6 are merged and verified:

1. Teammate signs in at `/auth/login` (Google or magic-link email — no password).
2. They search `/players` for their own name.
   - **Found** (most national-team players are already seeded) → open their profile → "Is this you? Claim Profile."
   - **Not found** → `/players/submit` to create a new profile, then search again and claim it.
3. From `/dashboard`, complete their profile (`/dashboard/edit`: bio, photo, measurables).
4. Try `/evaluate` (Athlete Evaluation) and `/iq/general` (Flag IQ quiz) — both feed the ranking system.
5. Feedback channel: however Ambra/Tika want it collected (group chat, form, etc. — not built, just needs a channel).

Nothing in this script needs new code beyond Tasks 1–4 above — everything else (search, submit, evaluate, IQ, onboarding checklist) is already live and working.
