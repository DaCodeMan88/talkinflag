# Onboarding & Profile UX Overhaul — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the four onboarding blockers reported during real user (Ambra) onboarding — a claimed owner sees the "Unclaimed / Claim Profile" stranger view, players can't edit their basic info, the logged‑in vs logged‑out profile views diverge confusingly, and Instagram Reels / YouTube Shorts leak into the podcast episode feed — then set up a Phase 2 UX/journey overhaul.

**Architecture:** Next.js 15 App Router. The profile page (`players/[id]`) becomes **owner‑aware** via a single pure `profileViewerState()` helper so the claim CTA, badges, and a new "Edit your profile" bar are driven by one tested source of truth. Self‑serve editing expands to **soft identity fields** (position, city, country) through the existing PATCH route, while **impersonation/ranking‑sensitive fields** (name, team/school, level) go through a new `profile_change_requests` table modeled exactly on the existing `career_updates` approve/reject flow. Episodes are sourced from a **dedicated YouTube playlist** (`YOUTUBE_PLAYLIST_ID`) with a Shorts filter as defense‑in‑depth.

**Tech Stack:** Next.js 15 · TypeScript · Supabase (RLS‑enabled, service‑role writes) · Vitest · Resend · Vercel. Tests are colocated `*.test.ts`; run with `npm test` (`vitest run`).

---

## Root‑cause summary (verified against current code)

| # | Symptom (Ambra) | Root cause | File |
|---|---|---|---|
| 1 | "Still shows my profile unclaimed / says claim or create" | Public profile page loads `user` but **never checks `claimed_by === user.id`**; claim CTA + "Unclaimed" badge + data notice are gated only on `!is_claimed`. Owner sees the stranger view. Her DB row is correct (`is_claimed=true, claim_pending=false, is_approved=true`; no duplicate profile). | `src/app/players/[id]/page.tsx` |
| 2 | "Can't edit basic info" | Edit form + PATCH route allow bio/IG/measurables/career only. **Name, position, team/school, city, country, level are not editable at all.** | `src/app/dashboard/edit/EditProfileForm.tsx`, `src/app/api/players/[id]/profile/route.ts` |
| 3 | "Logged‑in view differs from logged‑out" | Same as #1 — there is no *intentional* owner mode, so the difference reads as a bug. Dashboard checklist literally says **"Claim or create your player profile"** even after claiming. | `players/[id]/page.tsx`, `src/app/dashboard/page.tsx` |
| 4 | "IG posts mixed under episodes" | `getEpisodes()` hits the YouTube **search** API channel‑wide (`q="Talkin Flag"`, `order=date`) with **no playlist scope and no Shorts filter** — cross‑posted Reels/Shorts render as episodes on the home hero + `/podcast`. | `src/lib/youtube.ts`, `src/app/podcast/page.tsx`, `src/app/page.tsx` |

## Design decisions (confirmed with owner)

1. **Guarded self‑serve editing.** Soft fields (position, city, country + all currently‑editable fields) are self‑serve. **Name, team/school, and level** require a change request the admin approves.
2. **Dedicated playlist** for episodes (`YOUTUBE_PLAYLIST_ID`), Shorts filter as a safety net.
3. **Phase 1 now** (blockers, this doc's detailed tasks) **+ Phase 2 overhaul** (backlog at the end).

## Ground rules for the executor

- **RLS posture (do not violate):** cookie client (`@/lib/supabase/server` → `createClient`) = `auth.getUser()` + policy‑backed tables only. Every service‑only table (`career_updates`, `profile_change_requests`, `players` writes) uses the service‑role admin client (`createAdminClient` from `@/lib/eval/admin-client`, or `createServerClient` from `@/lib/supabase`). Every `/admin` + `/api/admin` surface gates via `isAdminEmail`/`getAdminUser`.
- **TDD:** write the failing test first, watch it fail, implement minimally, watch it pass, commit.
- **Verify commands:** `npm test` (vitest), `npx tsc --noEmit` (types), `npm run build` (prod build). Run the referenced narrow test with `npx vitest run <path>`.
- **Commit** after each task with the message shown.

---

# PHASE 1 — Onboarding blockers

## Task 1: Source episodes from a dedicated playlist + filter out Shorts

Fixes issue #4. Make episode selection pure and testable; the network fetch just feeds raw API items into pure mappers.

**Files:**
- Modify: `src/lib/youtube.ts`
- Create: `src/lib/youtube.test.ts`
- Modify: `.env.local` and `.env.example` (add `YOUTUBE_PLAYLIST_ID`)

**Step 1: Write the failing test**

Create `src/lib/youtube.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseIsoDuration, isShort, selectEpisodes, type RawVideo } from "./youtube";

describe("parseIsoDuration", () => {
  it("parses minutes and seconds", () => {
    expect(parseIsoDuration("PT1M2S")).toBe(62);
  });
  it("parses hours", () => {
    expect(parseIsoDuration("PT1H0M0S")).toBe(3600);
  });
  it("parses seconds-only", () => {
    expect(parseIsoDuration("PT45S")).toBe(45);
  });
  it("returns 0 for junk", () => {
    expect(parseIsoDuration("nope")).toBe(0);
  });
});

describe("isShort", () => {
  it("flags sub-3-minute videos as shorts", () => {
    expect(isShort({ durationSec: 58 })).toBe(true);
    expect(isShort({ durationSec: 179 })).toBe(true);
  });
  it("passes real episodes", () => {
    expect(isShort({ durationSec: 1800 })).toBe(false);
  });
  it("flags #shorts by title even when duration is unknown", () => {
    expect(isShort({ durationSec: 0, title: "Big play! #Shorts" })).toBe(true);
  });
});

describe("selectEpisodes", () => {
  const long: RawVideo = { id: "a", title: "Ep 39 | Phil Cutler", description: "", thumbnail: "", publishedAt: "2026-01-01T00:00:00Z", durationSec: 1800 };
  const short: RawVideo = { id: "b", title: "Hype #shorts", description: "", thumbnail: "", publishedAt: "2026-01-02T00:00:00Z", durationSec: 30 };

  it("drops shorts and keeps episodes", () => {
    const out = selectEpisodes([short, long], 10);
    expect(out.map((e) => e.id)).toEqual(["a"]);
  });
  it("respects the max", () => {
    expect(selectEpisodes([long, { ...long, id: "c" }], 1)).toHaveLength(1);
  });
  it("maps guest name and episode number", () => {
    const [e] = selectEpisodes([long], 10);
    expect(e.guestName).toBe("Phil Cutler");
    expect(e.episodeNumber).toBe(39);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/youtube.test.ts`
Expected: FAIL — `parseIsoDuration`, `isShort`, `selectEpisodes`, `RawVideo` are not exported.

**Step 3: Write the implementation**

In `src/lib/youtube.ts`, add near the top (after the `Episode` import) these exported pure helpers, and refactor `getEpisodes` to prefer the playlist. Full additions:

```ts
export interface RawVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  durationSec: number; // 0 when unknown (playlist path without a contentDetails call)
}

const SHORT_MAX_SEC = 180; // anything under 3 min is treated as a Short/reel

/** ISO‑8601 duration (e.g. "PT1M2S") → seconds. Returns 0 for unparseable input. */
export function parseIsoDuration(iso: string): number {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso ?? "");
  if (!m) return 0;
  const [, h, min, s] = m;
  return (parseInt(h ?? "0") * 3600) + (parseInt(min ?? "0") * 60) + parseInt(s ?? "0");
}

/** True when a video is a Short/reel: too short, or explicitly tagged #shorts. */
export function isShort(v: { durationSec: number; title?: string }): boolean {
  if (v.durationSec > 0 && v.durationSec < SHORT_MAX_SEC) return true;
  return /#shorts?\b/i.test(v.title ?? "");
}

/** Pure: raw videos → episode list, Shorts removed, capped to `max`. */
export function selectEpisodes(videos: RawVideo[], max: number): Episode[] {
  return videos
    .filter((v) => !isShort(v))
    .slice(0, max)
    .map((v) => ({
      id: v.id,
      title: v.title,
      description: v.description,
      thumbnail: v.thumbnail,
      publishedAt: v.publishedAt,
      youtubeUrl: `https://www.youtube.com/watch?v=${v.id}`,
      guestName: parseGuestName(v.title),
      episodeNumber: parseEpisodeNumber(v.title),
      tags: deriveTopicTags(v.title, v.description),
    }));
}
```

Add the playlist fetch and route `getEpisodes` through it. Add this function and edit `getEpisodes`:

```ts
const PLAYLIST_ID = process.env.YOUTUBE_PLAYLIST_ID;

/** Fetch a playlist's videos (with durations) as RawVideo[]. Empty on any failure. */
async function fetchPlaylistVideos(playlistId: string, maxResults: number): Promise<RawVideo[]> {
  if (!API_KEY || API_KEY === "PLACEHOLDER_YOUTUBE_API_KEY") return [];
  try {
    const listUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    listUrl.searchParams.set("key", API_KEY);
    listUrl.searchParams.set("playlistId", playlistId);
    listUrl.searchParams.set("maxResults", String(Math.min(maxResults, 50)));
    listUrl.searchParams.set("part", "snippet,contentDetails");
    const res = await fetch(listUrl.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    const items: Array<{ snippet?: Record<string, unknown>; contentDetails?: { videoId?: string } }> = data.items ?? [];
    const ids = items.map((i) => i.contentDetails?.videoId).filter(Boolean) as string[];
    if (ids.length === 0) return [];

    // One videos call gets durations so we can drop Shorts.
    const vidUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    vidUrl.searchParams.set("key", API_KEY);
    vidUrl.searchParams.set("id", ids.join(","));
    vidUrl.searchParams.set("part", "snippet,contentDetails");
    const vres = await fetch(vidUrl.toString(), { next: { revalidate: 3600 } });
    if (!vres.ok) return [];
    const vdata = await vres.json();
    return (vdata.items ?? []).map((it: {
      id: string;
      snippet: { title: string; description?: string; publishedAt: string; thumbnails?: Record<string, { url: string }> };
      contentDetails: { duration: string };
    }): RawVideo => ({
      id: it.id,
      title: it.snippet.title,
      description: it.snippet.description ?? "",
      thumbnail: it.snippet.thumbnails?.maxres?.url ?? it.snippet.thumbnails?.high?.url ?? it.snippet.thumbnails?.medium?.url ?? "",
      publishedAt: it.snippet.publishedAt,
      durationSec: parseIsoDuration(it.contentDetails.duration),
    }));
  } catch {
    return [];
  }
}
```

Then change the top of `getEpisodes(maxResults = 50)` so the playlist wins, and both paths run through `selectEpisodes`:

```ts
export async function getEpisodes(maxResults = 50): Promise<Episode[]> {
  if (!API_KEY || API_KEY === "PLACEHOLDER_YOUTUBE_API_KEY" || !CHANNEL_ID) {
    return getMockEpisodes(maxResults);
  }

  // Preferred: a curated podcast playlist (owner-controlled, no Shorts).
  if (PLAYLIST_ID) {
    const vids = await fetchPlaylistVideos(PLAYLIST_ID, maxResults);
    if (vids.length > 0) return selectEpisodes(vids, maxResults);
    // fall through to channel search if the playlist call yielded nothing
  }

  try {
    // ...existing search fetch unchanged up to `const data = await res.json();`...
    // Replace the final `return data.items.map(...)` block with:
    const raw: RawVideo[] = (data.items ?? []).map((item: {
      id: { videoId: string };
      snippet: { title: string; description: string; thumbnails: Record<string, { url: string }>; publishedAt: string };
    }): RawVideo => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || "",
      publishedAt: item.snippet.publishedAt,
      durationSec: 0, // search API has no duration; isShort falls back to #shorts title check
    }));
    if (raw.length === 0) return getMockEpisodes(maxResults);
    return selectEpisodes(raw, maxResults);
  } catch (err) {
    console.error("YouTube fetch error:", err);
    return getMockEpisodes(maxResults);
  }
}
```

> Note: the search‑fallback path can only detect `#shorts` by title (no duration). That's acceptable as a stopgap — the playlist is the real fix. `getMockEpisodes` should also gain `durationSec: 600` on each item so it never trips the filter (add the field to the mock map return).

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/youtube.test.ts`
Expected: PASS (10 assertions).

**Step 5: Add the env var**

Add `YOUTUBE_PLAYLIST_ID=` to `.env.example` with a comment, and to `.env.local` (leave blank locally). Do **not** commit real secrets.

**Step 6: Commit**

```bash
git add src/lib/youtube.ts src/lib/youtube.test.ts .env.example
git commit -m "fix: source episodes from playlist + filter shorts (no more IG reels as episodes)"
```

> **OWNER ACTION (blocks the real fix from taking effect):** Create/confirm a "Talkin Flag" playlist on the YouTube channel containing only real podcast episodes, then set `YOUTUBE_PLAYLIST_ID` in Vercel (Production + Preview) and redeploy.

---

## Task 2: Pure `profileViewerState()` — one source of truth for the profile view

Fixes issues #1 & #3 at the logic layer. This decides — for a given player row + viewing user — whether to show the claim CTA, which badge to show, and whether to show the owner "Edit" bar.

**Files:**
- Create: `src/lib/profile/viewer-state.ts`
- Create: `src/lib/profile/viewer-state.test.ts`

**Step 1: Write the failing test**

Create `src/lib/profile/viewer-state.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { profileViewerState } from "./viewer-state";

const base = { is_claimed: false, claim_pending: false, claimed_by: null as string | null };

describe("profileViewerState", () => {
  it("stranger, unclaimed profile → claim CTA + unclaimed badge, no edit bar", () => {
    const s = profileViewerState(base, "viewer-1");
    expect(s).toMatchObject({ isOwner: false, showClaimCta: true, badge: "unclaimed", showEditBar: false, showDataNotice: true });
  });

  it("owner of an approved claim → edit bar, claimed badge, no CTA, no data notice", () => {
    const s = profileViewerState({ is_claimed: true, claim_pending: false, claimed_by: "u1" }, "u1");
    expect(s).toMatchObject({ isOwner: true, showClaimCta: false, badge: "claimed", showEditBar: true, showDataNotice: false });
  });

  it("owner while claim still pending → pending bar, no CTA, no public claimed badge", () => {
    const s = profileViewerState({ is_claimed: true, claim_pending: true, claimed_by: "u1" }, "u1");
    expect(s).toMatchObject({ isOwner: true, showClaimCta: false, badge: "none", showEditBar: false, showPendingBar: true });
  });

  it("stranger viewing an approved claimed profile → claimed badge, no CTA", () => {
    const s = profileViewerState({ is_claimed: true, claim_pending: false, claimed_by: "u1" }, "viewer-2");
    expect(s).toMatchObject({ isOwner: false, showClaimCta: false, badge: "claimed", showEditBar: false });
  });

  it("logged-out viewer on unclaimed profile → claim CTA", () => {
    const s = profileViewerState(base, null);
    expect(s).toMatchObject({ isOwner: false, showClaimCta: true, badge: "unclaimed" });
  });

  it("stranger viewing a pending claim → reads as unclaimed publicly (anti-impersonation)", () => {
    const s = profileViewerState({ is_claimed: true, claim_pending: true, claimed_by: "u1" }, "viewer-2");
    expect(s).toMatchObject({ isOwner: false, badge: "unclaimed", showClaimCta: false });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/profile/viewer-state.test.ts`
Expected: FAIL — module not found.

**Step 3: Write the implementation**

Create `src/lib/profile/viewer-state.ts`:

```ts
export interface ClaimFields {
  is_claimed: boolean | null;
  claim_pending: boolean | null;
  claimed_by: string | null;
}

export type ProfileBadge = "claimed" | "unclaimed" | "none";

export interface ProfileViewerState {
  isOwner: boolean;
  /** Claim approved and public — safe to show self-reported labels & ✓ Claimed. */
  claimApproved: boolean;
  /** Show the "Is this you? Claim Profile" CTA. */
  showClaimCta: boolean;
  /** Show the owner-only "This is your profile — Edit" bar. */
  showEditBar: boolean;
  /** Show the owner-only "claim pending review" bar. */
  showPendingBar: boolean;
  /** Show the "data compiled from public sources" notice (unclaimed, non-owner). */
  showDataNotice: boolean;
  badge: ProfileBadge;
}

/**
 * Single source of truth for how a profile renders to a given viewer.
 * `userId` is the signed-in user's id, or null when logged out.
 *
 * Rules:
 * - A pending claim never reads as "claimed" to the public (anti-impersonation),
 *   but the owner sees a "pending review" bar instead of a claim CTA.
 * - The owner of an approved claim gets an edit bar and never the claim CTA.
 */
export function profileViewerState(player: ClaimFields, userId: string | null): ProfileViewerState {
  const isClaimed = !!player.is_claimed;
  const isPending = !!player.claim_pending;
  const isOwner = !!userId && !!player.claimed_by && player.claimed_by === userId;
  const claimApproved = isClaimed && !isPending;

  // Publicly this profile is "taken" only once the claim is approved.
  const publiclyClaimed = claimApproved;

  const showClaimCta = !isClaimed && !isOwner;
  const showEditBar = isOwner && claimApproved;
  const showPendingBar = isOwner && isClaimed && isPending;
  const showDataNotice = !isClaimed && !isOwner;

  let badge: ProfileBadge;
  if (publiclyClaimed) badge = "claimed";
  else if (!isClaimed) badge = "unclaimed";
  else badge = "none"; // pending, to a stranger

  return { isOwner, claimApproved, showClaimCta, showEditBar, showPendingBar, showDataNotice, badge };
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/profile/viewer-state.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/lib/profile/viewer-state.ts src/lib/profile/viewer-state.test.ts
git commit -m "feat: profileViewerState helper — owner-aware claim/badge/edit logic"
```

---

## Task 3: Make the public profile page owner‑aware

Wire Task 2 into the page so Ambra sees "This is your profile — Edit" instead of "Is this you? Claim Profile."

**Files:**
- Modify: `src/app/players/[id]/page.tsx`

**Step 1: Import and compute state**

After the `claimApproved` line (~186), replace the ad‑hoc `claimApproved` with the helper. Add the import near the other `@/lib` imports:

```ts
import { profileViewerState } from "@/lib/profile/viewer-state";
```

Replace:

```ts
const claimApproved = !!player.is_claimed && !player.claim_pending;
```

with:

```ts
const view = profileViewerState(player, user?.id ?? null);
const claimApproved = view.claimApproved; // keep existing references working
```

**Step 2: Owner edit bar**

Immediately after the `!player.is_approved` pending banner block (~322, right before `<div className="flex flex-col md:flex-row md:items-end gap-6">`), insert:

```tsx
{view.showEditBar && (
  <div className="bg-brand-yellow/10 border border-brand-yellow/40 p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
    <span className="text-brand-yellow text-sm font-display uppercase tracking-widest">
      This is your profile
    </span>
    <div className="flex items-center gap-4">
      <Link href="/dashboard/edit" className="bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-xs px-4 py-2 hover:bg-brand-yellow/90 transition-colors">
        Edit Profile
      </Link>
      <Link href="/dashboard" className="text-brand-yellow/70 text-xs font-display uppercase tracking-widest hover:text-brand-yellow transition-colors">
        Dashboard →
      </Link>
    </div>
  </div>
)}
{view.showPendingBar && (
  <div className="bg-brand-yellow/10 border border-brand-yellow/30 p-4 mb-6 text-brand-yellow text-sm leading-relaxed">
    <span className="font-display uppercase tracking-widest">Claim pending review.</span>{" "}
    <span className="text-brand-yellow/70">Editing and your public “Claimed” badge unlock once an admin approves it.</span>
  </div>
)}
```

**Step 3: Drive the avatar badge, header badge, claim CTA, and notice off `view`**

- Avatar "Unclaimed" chip (~340): change `{!player.is_claimed && (` → `{view.badge === "unclaimed" && (`.
- Header badge block (~384): replace the `claimApproved ? … : !player.is_claimed ? …` ternary with:

```tsx
{view.badge === "claimed" ? (
  <span className="border border-brand-yellow/50 text-brand-yellow text-xs px-3 py-1 uppercase tracking-wide font-display">✓ Claimed</span>
) : view.badge === "unclaimed" ? (
  <span className="border border-brand-white/15 text-brand-white/30 text-xs px-3 py-1 uppercase tracking-wide font-display">Unclaimed</span>
) : null}
```

- Claim CTA block (~401): change `{!player.is_claimed && (` → `{view.showClaimCta && (`.
- Data‑source notice (~417): change `{!player.is_claimed && (` → `{view.showDataNotice && (`.

**Step 4: Verify types + build the page**

Run: `npx tsc --noEmit`
Expected: no new errors.

Run: `npm run build`
Expected: build succeeds; `/players/[id]` compiles.

**Step 5: Manual smoke (see Task 11 for the full checklist)**

Confirm logic via the unit tests already covering `profileViewerState`; the page wiring is verified in Task 11's browser QA.

**Step 6: Commit**

```bash
git add src/app/players/[id]/page.tsx
git commit -m "fix: owner-aware profile page — edit bar for owners, no claim CTA on your own profile"
```

---

## Task 4: Expand self‑serve SOFT fields (position, city, country) in the PATCH route

Fixes the editable half of issue #2. Add validated soft identity fields to the profile PATCH route and its sanitizer.

**Files:**
- Modify: `src/lib/profile-edit.ts`
- Modify: `src/lib/profile-edit.test.ts`
- Modify: `src/app/api/players/[id]/profile/route.ts`

**Step 1: Write the failing test**

Append to `src/lib/profile-edit.test.ts`:

```ts
import { sanitizeIdentityPayload } from "./profile-edit";

describe("sanitizeIdentityPayload (soft fields)", () => {
  it("accepts a valid position and passes it through", () => {
    expect(sanitizeIdentityPayload({ position: "WR" })).toEqual({ position: "WR" });
  });
  it("rejects an out-of-allowlist position → null (clears)", () => {
    expect(sanitizeIdentityPayload({ position: "Kicker" })).toEqual({ position: null });
  });
  it("caps and trims city/country", () => {
    expect(sanitizeIdentityPayload({ city: "  Rome  ", country: "Italy" }))
      .toEqual({ city: "Rome", country: "Italy" });
  });
  it("only returns keys present in the body (PATCH semantics)", () => {
    expect(sanitizeIdentityPayload({ city: "Rome" })).toEqual({ city: "Rome" });
  });
  it("never returns name/team/level even if sent (guarded fields are stripped)", () => {
    const out = sanitizeIdentityPayload({ first_name: "X", last_name: "Y", school_or_team: "Z", level: "pro" });
    expect(out).toEqual({});
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/profile-edit.test.ts`
Expected: FAIL — `sanitizeIdentityPayload` is not exported.

**Step 3: Implement `sanitizeIdentityPayload`**

Add to `src/lib/profile-edit.ts`:

```ts
export const ALLOWED_POSITIONS = ["QB", "WR", "DB", "LB", "C", "Rusher", "Utility"] as const;

/**
 * Soft identity fields a claimed player may self-edit (direct columns).
 * Guarded fields (first_name, last_name, school_or_team, level) are intentionally
 * NOT here — they go through profile_change_requests + admin approval.
 * PATCH semantics: only keys present in `body` appear in the result.
 */
export function sanitizeIdentityPayload(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (body.position !== undefined) {
    const p = String(body.position).trim();
    out.position = (ALLOWED_POSITIONS as readonly string[]).includes(p) ? p : null;
  }
  if (body.city !== undefined) out.city = cappedString(body.city, 80);
  if (body.country !== undefined) out.country = cappedString(body.country, 60);
  return out;
}
```

(`cappedString` already exists in this file.)

**Step 4: Wire it into the PATCH route**

In `src/app/api/players/[id]/profile/route.ts`, after the existing `identity` block (before the stats block ~line 51), merge soft identity fields:

```ts
import { sanitizeStatsPayload, shouldResetVerification, sanitizeIdentityPayload } from "@/lib/profile-edit";
// ...
Object.assign(identity, sanitizeIdentityPayload(body as Record<string, unknown>));
```

No other change — `identity` is already spread into `update`.

**Step 5: Run tests to verify they pass**

Run: `npx vitest run src/lib/profile-edit.test.ts`
Expected: PASS.

Run: `npx tsc --noEmit`
Expected: clean.

**Step 6: Commit**

```bash
git add src/lib/profile-edit.ts src/lib/profile-edit.test.ts src/app/api/players/[id]/profile/route.ts
git commit -m "feat: players can self-edit soft identity (position, city, country)"
```

---

## Task 5: Surface the new soft fields in the edit form

**Files:**
- Modify: `src/app/dashboard/edit/page.tsx` (pass `position`, `city`, `country` into the form)
- Modify: `src/app/dashboard/edit/EditProfileForm.tsx` (inputs + include in PATCH body)

**Step 1: Pass the fields from the server page**

In `src/app/dashboard/edit/page.tsx`, extend the `player={{ … }}` prop with:

```tsx
position: player.position ?? "",
city: player.city ?? "",
country: player.country ?? "",
```

**Step 2: Add to the form's props + state**

In `EditProfileForm.tsx` `PlayerFormData` add `position: string; city: string; country: string;`, add to `ProfileDraft`, add `useState` for each, and include them in `applyDraft`.

**Step 3: Render inputs in the Identity section**

Add after the Instagram field (a `<select>` for position using `ALLOWED_POSITIONS`, and text inputs for City and Country):

```tsx
<div className="grid grid-cols-2 gap-4">
  <div>
    <label className="block text-xs font-display uppercase tracking-widest text-brand-white/50 mb-2">Position</label>
    <select value={position} onChange={(e) => setPosition(e.target.value)}
      className="w-full bg-[#111111] border border-brand-white/10 text-brand-white px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow/50 transition-colors">
      <option value="">—</option>
      {["QB","WR","DB","LB","C","Rusher","Utility"].map((p) => <option key={p} value={p}>{p}</option>)}
    </select>
  </div>
  <div>
    <label className="block text-xs font-display uppercase tracking-widest text-brand-white/50 mb-2">City</label>
    <input type="text" value={city} onChange={(e) => setCity(e.target.value.slice(0, 80))}
      placeholder="e.g. Rome"
      className="w-full bg-[#111111] border border-brand-white/10 text-brand-white placeholder-brand-white/20 px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow/50 transition-colors" />
  </div>
  <div>
    <label className="block text-xs font-display uppercase tracking-widest text-brand-white/50 mb-2">Country</label>
    <input type="text" value={country} onChange={(e) => setCountry(e.target.value.slice(0, 60))}
      placeholder="e.g. Italy"
      className="w-full bg-[#111111] border border-brand-white/10 text-brand-white placeholder-brand-white/20 px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow/50 transition-colors" />
  </div>
</div>
```

**Step 4: Include in the PATCH body**

In `handleSave`'s `body: JSON.stringify({ … })`, add `position, city, country,`.

**Step 5: Verify**

Run: `npx tsc --noEmit` → clean.
Run: `npm run build` → succeeds.

**Step 6: Commit**

```bash
git add src/app/dashboard/edit/page.tsx src/app/dashboard/edit/EditProfileForm.tsx
git commit -m "feat: edit form exposes position, city, country"
```

---

## Task 6: Migration + validation lib for guarded change requests

Fixes the guarded half of issue #2. New `profile_change_requests` table (RLS on, no policies) modeled on `career_updates`, plus a pure validator for the requested field/value.

**Files:**
- Create: `supabase/migrations/012_profile_change_requests.sql`
- Create: `src/lib/profile/change-request.ts`
- Create: `src/lib/profile/change-request.test.ts`

**Step 1: Write the failing test**

Create `src/lib/profile/change-request.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { GUARDED_FIELDS, sanitizeChangeRequest } from "./change-request";

describe("sanitizeChangeRequest", () => {
  it("lists the guarded fields", () => {
    expect(GUARDED_FIELDS).toEqual(["first_name", "last_name", "school_or_team", "level"]);
  });
  it("accepts a valid name change", () => {
    expect(sanitizeChangeRequest("first_name", "  Ambra ")).toEqual({ field: "first_name", value: "Ambra" });
  });
  it("validates level against the allowlist", () => {
    expect(sanitizeChangeRequest("level", "national")).toEqual({ field: "level", value: "national" });
    expect(sanitizeChangeRequest("level", "banana")).toBeNull();
  });
  it("rejects an unknown field", () => {
    expect(sanitizeChangeRequest("is_verified", "true")).toBeNull();
  });
  it("rejects empty values", () => {
    expect(sanitizeChangeRequest("last_name", "   ")).toBeNull();
  });
  it("caps long values", () => {
    const out = sanitizeChangeRequest("school_or_team", "x".repeat(300));
    expect(out?.value.length).toBe(120);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/profile/change-request.test.ts`
Expected: FAIL — module not found.

**Step 3: Implement the validator**

Create `src/lib/profile/change-request.ts`:

```ts
export const GUARDED_FIELDS = ["first_name", "last_name", "school_or_team", "level"] as const;
export type GuardedField = (typeof GUARDED_FIELDS)[number];

const ALLOWED_LEVELS = ["youth", "high_school", "college", "national", "pro"] as const;
const MAX = 120;

export interface SanitizedChange {
  field: GuardedField;
  value: string;
}

/** Validate a requested guarded-field change. Returns null if invalid. */
export function sanitizeChangeRequest(field: unknown, value: unknown): SanitizedChange | null {
  if (typeof field !== "string" || !(GUARDED_FIELDS as readonly string[]).includes(field)) return null;
  const f = field as GuardedField;
  const v = String(value ?? "").trim().slice(0, MAX);
  if (!v) return null;
  if (f === "level" && !(ALLOWED_LEVELS as readonly string[]).includes(v)) return null;
  return { field: f, value: v };
}

export function guardedFieldLabel(field: GuardedField): string {
  return {
    first_name: "First name",
    last_name: "Last name",
    school_or_team: "Team / School",
    level: "Competition level",
  }[field];
}
```

**Step 4: Write the migration**

Create `supabase/migrations/012_profile_change_requests.sql`:

```sql
-- Guarded profile-field change requests. A claimed player can request a change
-- to impersonation/ranking-sensitive fields (name, team/school, level); an admin
-- approves, which writes the players column. Soft fields (position/city/country/
-- measurables/career) are self-serve via the profile PATCH route and never touch
-- this table.
--
-- Security posture (matches career_updates): RLS enabled, NO policies — anon key
-- cannot touch it; all reads/writes go through the server with the service role.

CREATE TABLE IF NOT EXISTS profile_change_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id     uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  requested_by  uuid NOT NULL,                       -- auth.users.id (must equal players.claimed_by)
  field         text NOT NULL,                       -- first_name | last_name | school_or_team | level
  old_value     text,
  new_value     text NOT NULL,
  status        text NOT NULL DEFAULT 'pending',     -- pending | approved | rejected
  reviewed_by   uuid,
  reviewed_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profile_change_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS pcr_player_idx ON profile_change_requests (player_id, status);
CREATE INDEX IF NOT EXISTS pcr_status_idx ON profile_change_requests (status, created_at DESC);
```

**Step 5: Apply the migration**

Apply via the Supabase MCP `apply_migration` (name: `012_profile_change_requests`) against project `wxeuybksowhncalrnttl`, or paste the SQL into the Supabase SQL editor. Confirm with `list_migrations`.

**Step 6: Run tests + commit**

Run: `npx vitest run src/lib/profile/change-request.test.ts` → PASS.

```bash
git add supabase/migrations/012_profile_change_requests.sql src/lib/profile/change-request.ts src/lib/profile/change-request.test.ts
git commit -m "feat: profile_change_requests table + guarded-field validator"
```

---

## Task 7: Submit API for guarded change requests

**Files:**
- Create: `src/app/api/players/[id]/change-request/route.ts`

**Step 1: Implement (mirrors the career-updates submit route)**

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@/lib/supabase";
import { rateLimit, getClientIp, retryAfterSeconds } from "@/lib/rate-limit";
import { sanitizeChangeRequest, guardedFieldLabel } from "@/lib/profile/change-request";
import { notifyAdmins } from "@/lib/claims";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ip = getClientIp(req);
  const rl = rateLimit(`pcr:${ip}`, { limit: 5, windowMs: 60_000 });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests — try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds(rl.reset)) } });
  }

  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const change = sanitizeChangeRequest(body?.field, body?.new_value);
  if (!change) return NextResponse.json({ error: "Invalid change request." }, { status: 400 });

  const db = createServerClient();
  const { data: player } = await db
    .from("players")
    .select("id, first_name, last_name, claimed_by, is_claimed, claim_pending, first_name, last_name, school_or_team, level")
    .eq("id", id).single();
  if (!player || !player.is_claimed || player.claim_pending || player.claimed_by !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const oldValue = (player as Record<string, unknown>)[change.field];
  const { error } = await db.from("profile_change_requests").insert({
    player_id: id,
    requested_by: user.id,
    field: change.field,
    old_value: oldValue != null ? String(oldValue) : null,
    new_value: change.value,
    status: "pending",
  });
  if (error) return NextResponse.json({ error: "Could not save request." }, { status: 500 });

  await notifyAdmins(
    `Profile change request: ${player.first_name} ${player.last_name}`,
    `<div style="font-family:sans-serif;max-width:600px">
       <h2 style="color:#FDDD58">Profile Change Request</h2>
       <p><strong>${player.first_name} ${player.last_name}</strong> requested a change to
       <strong>${guardedFieldLabel(change.field)}</strong>.</p>
       <p>From: <em>${oldValue ?? "—"}</em> → To: <strong>${change.value}</strong></p>
       <p><a href="https://talkinflag.com/admin/change-requests">Review in Admin</a></p>
     </div>`
  );

  return NextResponse.json({ ok: true });
}
```

**Step 2: Verify + commit**

Run: `npx tsc --noEmit` → clean.

```bash
git add src/app/api/players/[id]/change-request/route.ts
git commit -m "feat: submit API for guarded profile-field change requests"
```

---

## Task 8: "Request a correction" UI on the edit page

Give the owner a visible, honest path for the locked fields (this is what removes the "I can't edit my basic info" frustration even for guarded fields).

**Files:**
- Create: `src/app/dashboard/edit/ChangeRequestForm.tsx` (client)
- Modify: `src/app/dashboard/edit/page.tsx` (render it, pass current name/team/level)

**Step 1: Build the client form**

A small form: a `<select>` of guarded fields (First name, Last name, Team / School, Competition level), a value input (free text, or a level `<select>` when field = level), submit → `POST /api/players/{id}/change-request`. On success show "Sent for review — we'll email you when it's approved." Include the current value beside each so the user sees what they're changing.

**Step 2: Render below the Career section on the edit page**

Add a "Basic Info (needs review)" section explaining: *"Your name, team, and competition level are protected to prevent impersonation and keep rankings fair. Request a change and our team will apply it — usually within a day."* Then `<ChangeRequestForm playerId city…/>`.

**Step 3: Verify + commit**

Run: `npx tsc --noEmit` → clean. Run: `npm run build` → succeeds.

```bash
git add src/app/dashboard/edit/ChangeRequestForm.tsx src/app/dashboard/edit/page.tsx
git commit -m "feat: request-a-correction UI for guarded profile fields"
```

---

## Task 9: Admin review of change requests (approve applies the change)

**Files:**
- Create: `src/app/admin/change-requests/page.tsx` (server, admin‑gated list)
- Create: `src/app/admin/change-requests/ChangeRequestActions.tsx` (client approve/reject)
- Create: `src/app/api/admin/change-requests/[id]/route.ts` (PATCH — applies on approve)
- Modify: `src/app/admin/page.tsx` (add a pending‑count card/link)

**Step 1: Implement the approve/reject API (mirrors admin career-updates route)**

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerAuth } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/eval/admin-client";
import { isAdminEmail } from "@/lib/admin";
import { revalidatePath } from "next/cache";
import { sanitizeChangeRequest } from "@/lib/profile/change-request";
import { sendEmail } from "@/lib/email";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await createServerAuth();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminEmail(user.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { status } = await req.json().catch(() => ({}));
  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: reqRow } = await db
    .from("profile_change_requests")
    .select("id, player_id, field, new_value, status")
    .eq("id", id).single();
  if (!reqRow) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.from("profile_change_requests")
    .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: user.id })
    .eq("id", id);

  if (status === "approved") {
    // Re-validate at apply time — never trust the stored value blindly.
    const change = sanitizeChangeRequest(reqRow.field, reqRow.new_value);
    if (change) {
      await db.from("players").update({ [change.field]: change.value, updated_at: new Date().toISOString() })
        .eq("id", reqRow.player_id);
      // level/team changes affect rankings — bust the profile + list caches.
      revalidatePath(`/players/${reqRow.player_id}`);
      revalidatePath("/players");
    }
  }

  return NextResponse.json({ ok: true });
}
```

**Step 2: Implement the admin list page + actions**

List pending `profile_change_requests` joined to the player name (service‑role read), each row showing field, old → new, with Approve/Reject buttons (client component POSTing the PATCH). Gate the page with `getAdminUser()` → `redirect("/")` if null. Model the markup on `src/app/admin/credentials/page.tsx` + `CareerUpdateActions.tsx`.

**Step 3: Add the admin home card**

In `src/app/admin/page.tsx`, add a pending count for `profile_change_requests` (status='pending') and a link to `/admin/change-requests`, mirroring the existing pending‑count cards.

**Step 4: Verify + commit**

Run: `npx tsc --noEmit` → clean. Run: `npm run build` → succeeds.

```bash
git add src/app/admin/change-requests src/app/api/admin/change-requests src/app/admin/page.tsx
git commit -m "feat: admin review + apply for guarded profile change requests"
```

---

## Task 10: Fix the dashboard + claim language (stop saying "claim or create")

Fixes the remaining half of issues #1/#3 — the onboarding checklist that reads "Claim or create your player profile" even after claiming.

**Files:**
- Modify: `src/app/dashboard/page.tsx`

**Step 1: Context‑aware checklist label**

Replace the player checklist's first item (~121) so the label reflects state:

```tsx
player
  ? { label: "Your player profile", done: true, href: `/players/${player.id}`, cta: "View", doneHref: `/players/${player.id}`, doneCta: "View" }
  : { label: "Find & claim your player profile", done: false, href: "/players", cta: "Find" },
```

**Step 2: Clearer empty state for no‑profile accounts**

In the `else` branch that shows "No player profile linked" (~458), give two explicit paths instead of one: **Find your existing profile** (`/players`) and **Create a new profile** (`/players/submit`) — matching the checklist promise. Add the second button.

**Step 3: Verify + commit**

Run: `npx tsc --noEmit` → clean.

```bash
git add src/app/dashboard/page.tsx
git commit -m "fix: dashboard no longer tells claimed users to 'claim or create'; clearer find-vs-create"
```

---

## Task 11: Full verification pass

**Step 1: Whole test suite**

Run: `npm test`
Expected: all tests pass (the ~149 existing + the new youtube/viewer-state/profile-edit/change-request tests).

**Step 2: Types + build**

Run: `npx tsc --noEmit` → clean.
Run: `npm run build` → succeeds.

**Step 3: Browser QA (dev server via preview tools, not Bash)**

Start the dev server (`.claude/launch.json`, port 3000) and verify, signed in as a test owner of a claimed profile:

1. `/players/{owned-id}` shows **"This is your profile — Edit"**, no "Claim Profile", badge = **✓ Claimed**. (Issue #1/#3)
2. Same URL logged out → **✓ Claimed** badge, no edit bar, no claim CTA.
3. `/players/{unclaimed-id}` logged out → **Unclaimed** + "Is this you? Claim Profile" + data notice.
4. `/dashboard/edit` → change **Position/City/Country**, Save → reflected on the public profile after refresh. (Issue #2 soft)
5. `/dashboard/edit` → request a **name** change → appears in `/admin/change-requests`; approve → public profile name updates. (Issue #2 guarded)
6. `/dashboard` checklist first item reads "Your player profile" (done), not "Claim or create". (Issue #3)
7. `/podcast` and home "Latest Episodes" — with `YOUTUBE_PLAYLIST_ID` set, only real episodes; no Reels/Shorts. If the env var is unset locally, confirm mock episodes render (durationSec keeps them un‑filtered). (Issue #4)

**Step 4: Commit any QA fixes, then finalize**

```bash
git add -A
git commit -m "chore: Phase 1 onboarding UX fixes — QA pass"
```

> **OWNER ACTIONS after Phase 1 ships:**
> - Create/confirm the "Talkin Flag" YouTube playlist (real episodes only) and set `YOUTUBE_PLAYLIST_ID` in Vercel; redeploy.
> - Watch `/admin/change-requests` for incoming guarded‑field requests during onboarding.

---

# PHASE 2 — UX / journey / navigation overhaul (backlog)

Design‑led; scope each into its own detailed plan before building. Ordered by leverage for onboarding.

### 2.1 One coherent "your profile" journey
- Add a persistent **"My Profile / Dashboard"** entry to the primary nav + mobile menu when signed in (currently there's no obvious route from the site to your own profile). File: `src/components/layout/Nav.tsx`.
- Add an **"Edit"** affordance everywhere the owner sees their own card (search results, rankings rows, compare) — not just the profile page.
- Post‑claim: route the user straight into `/dashboard/edit` with the guided tour, not a static dashboard.

### 2.2 Onboarding funnel redesign
- Map the real journey: land → find profile → claim → (email verify) → **admin approval wait** → edit → verify stats. The **approval wait is invisible** to the user today except a dashboard banner. Add: a claim confirmation screen that sets expectations ("we'll email you within a day"), and an email on approval (the claim route already notifies admins; add the member‑facing approved email, mirroring the career‑update approved email).
- Reduce claim friction: pre‑fill and explain the honor‑system + review model on `/auth/claim/[id]`.

### 2.3 Trust & state legibility
- A single, documented set of profile states (unclaimed / pending / claimed / verified) with consistent badges across profile, list, dashboard, admin. Phase 1's `profileViewerState` is the seed — extend it to the `PlayerCard` and rankings table.
- Make "self‑reported" vs "✓ verified" unmistakable and consistent.

### 2.4 Navigation & IA audit
- Audit the 6‑item nav + footer against the actual top tasks (find/claim/edit profile, listen, rankings, events). Consider grouping athlete‑account actions under an account menu.
- Kill dead ends: every empty state (`/dashboard` no‑profile, no episodes, no events) needs a clear next action.

### 2.5 Content separation: Podcast vs Social
- Now that episodes come from a playlist, formally separate **Podcast** (long‑form) from **Clips/Social** (Reels/Shorts) — e.g. a "Clips" strip on `/media` fed intentionally, so social content has a home instead of leaking into episodes.

### 2.6 Visual & responsive consistency pass
- Mobile audit of the profile, edit form, and dashboard (long forms on phones).
- Consistent section rhythm, empty states, and loading skeletons.
- Accessibility: labels/roles on the new selects, focus states, reduced‑motion (already a project convention).

### 2.7 Instrumentation
- Add lightweight funnel logging (claim started → submitted → approved → first edit) so onboarding friction is measurable, not anecdotal. There is already a `join_funnel` migration (010) to model on.

---

## Appendix — key files touched (Phase 1)

| Concern | Files |
|---|---|
| Episodes/IG | `src/lib/youtube.ts`, `src/lib/youtube.test.ts` |
| Owner-aware profile | `src/lib/profile/viewer-state.ts` (+test), `src/app/players/[id]/page.tsx` |
| Soft self-edit | `src/lib/profile-edit.ts` (+test), `src/app/api/players/[id]/profile/route.ts`, `src/app/dashboard/edit/*` |
| Guarded change requests | `supabase/migrations/012_profile_change_requests.sql`, `src/lib/profile/change-request.ts` (+test), `src/app/api/players/[id]/change-request/route.ts`, `src/app/admin/change-requests/*`, `src/app/api/admin/change-requests/[id]/route.ts` |
| Dashboard/claim copy | `src/app/dashboard/page.tsx` |
