# Media Gallery Balance + Admin-Curated Instagram Grid Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove the "Behind the mic" photo from the Media page gallery, and move the 9 Instagram reels from hardcoded source into a Supabase table Ambra curates herself at `/admin/media`, so the monthly "swap in a better-performing reel" job needs no developer and no deploy.

**Architecture:** Three layers, mirroring the blog feature shipped 2026-08-04 (`490a334`) exactly. (1) A service-only table `media_instagram_posts`, seeded in the migration with the 9 shortcodes currently hardcoded, so the public page renders identically the moment it ships. (2) A pure lib module `src/lib/media/instagram.ts` holding URL→shortcode parsing and the "top 9 live, in position order" selection — fully unit-tested, no DB. (3) An admin page `/admin/media` (server actions, service-role client) + the public `/media` page reading through the lib with a hardcoded fallback if the table is empty or errors.

**Tech Stack:** Next.js 16 App Router · TypeScript · Tailwind · Supabase (service-role client, RLS public-read) · Vitest

**Branch:** work continues on `ambra-round-2026-08-23` (currently clean).

---

## PM Section — Read This Before Writing Code

### Request 1: the gallery image

Ambra's attached screenshot is `/hosts-wide.jpg`, caption **"Behind the mic"** — the 4th and last entry in `GALLERY_IMAGES` in [src/app/media/page.tsx](src/app/media/page.tsx). It is `wide: true`, so in the `columns-1 sm:columns-2 lg:columns-3` masonry it sits alone at the bottom of a column and leaves the ragged edge she's describing. Removing it leaves 3 images — one wide hero + two portraits — which is exactly one per column at `lg`. That is the balanced layout.

**Per CLAUDE.md's additive rule: do NOT delete `/public/hosts-wide.jpg`.** The file stays on disk (it may be referenced elsewhere, and re-adding is then a one-line change); only the gallery entry is removed, with a comment recording why and when.

### Request 2: "keep just their best 9 performing reels, checked monthly"

Two things are being asked for and only one is buildable today:

| | Can we do it? |
|---|---|
| Show exactly 9 curated reels, swappable without a developer | **Yes** — this plan |
| Have the site *automatically know* which reels perform best | **No** — needs Instagram Graph API, which needs a Meta app + Business account + App Review (2–6 weeks, owner-blocked). Documented in the 2026-08-07 command-center plan. |

So the honest shape is: **Ambra reads the numbers in the Instagram app (Insights → Reels → sort by plays), and pastes the winners into `/admin/media`.** That takes her about two minutes a month. The admin page stores the play/like count she typed alongside each reel and shows the date she last touched it, so the grid can be ranked by real numbers and the page can nag when the list is more than 35 days stale. When Graph API access ever lands, it writes into the same columns and every consumer keeps working.

The grid is **capped at 9 live reels.** Adding a 10th requires retiring one — that cap is the feature, not a limitation. Retired reels are kept (`is_live = false`), never deleted, so Ambra can put one back.

### Request 3: "can Ambra edit the website herself with a vibe-coding agent?"

Answered in full in **Appendix A** at the end of this plan. Short version: a code-writing agent wired to the live repo is the wrong tool (it needs repo write + deploy access, and a bad generation ships a broken public site with no reviewer). The right answer is what this plan already builds — structured admin editors for the things that actually change — plus the read-only AI assistant already scoped as Phase 2 of the 2026-08-07 plan. **Nothing in Appendix A gets built in this plan; it's a decision memo for Daniel.**

### Risks

- **The public page could 500 if the table read fails.** *Mitigation:* `getLiveInstagramPosts()` catches and returns the hardcoded `FALLBACK_POSTS` (the same 9). The page can never render an empty grid.
- **Ambra pastes a post URL, not a reel URL, or a URL with tracking params.** *Mitigation:* `parseInstagramShortcode()` accepts `/reel/`, `/reels/`, `/p/`, `/tv/`, bare shortcodes, and strips query strings — tested.
- **Curation decays into staleness** (same failure mode as manual social metrics). *Mitigation:* `/admin/media` shows "Last curated N days ago" in amber past 35 days.

---

## Task 0: Baseline

**Step 1: Confirm branch and clean tree**

```bash
cd /Users/danielharris/Desktop/Flag/talkinflag && git branch --show-current && git status --porcelain
```

Expected: `ambra-round-2026-08-23` and no output from `git status`. If the tree is dirty, stop and ask.

**Step 2: Confirm the test suite is green before you touch anything**

```bash
cd /Users/danielharris/Desktop/Flag/talkinflag && npm test
```

Expected: all files pass. If something already fails, note it — do not try to fix it in this plan.

---

## Task 1: Remove the "Behind the mic" gallery image

**Files:**
- Modify: `src/app/media/page.tsx` (the `GALLERY_IMAGES` array, ~line 16-21)

There is no test for this — it is a content constant, and a test asserting "this array has 3 items" would break on Ambra's next photo add, which is exactly the wrong thing to lock down. Verification is visual, in Task 8.

**Step 1: Remove the entry, leaving a note**

Replace the `GALLERY_IMAGES` array with:

```ts
const GALLERY_IMAGES: { src: string; alt: string; wide?: boolean; caption?: string }[] = [
  { src: "/hosts-hero.jpg", alt: "Ambra & Tika Marcucci — Talkin Flag hosts", wide: true, caption: "Ambra & Tika Marcucci · Talkin Flag" },
  { src: "/ambra.jpg", alt: "Ambra Marcucci", caption: "Ambra Marcucci" },
  { src: "/tika.jpg", alt: "Tika Marcucci", caption: "Tika Marcucci" },
  // Removed 2026-09-14 at Ambra's request: the "Behind the mic" wide shot
  // (/hosts-wide.jpg) left a ragged bottom edge in the 3-column masonry.
  // The file is still in /public — re-add this line to bring it back:
  // { src: "/hosts-wide.jpg", alt: "Ambra & Tika wide shot", wide: true, caption: "Behind the mic" },
  // Add new images: { src: "/gallery/your-image.jpg", alt: "...", caption: "..." },
];
```

**Step 2: Verify the file is NOT deleted**

```bash
cd /Users/danielharris/Desktop/Flag/talkinflag && ls -la public/hosts-wide.jpg
```

Expected: the file exists. If it's missing, you deleted it — restore it with `git checkout public/hosts-wide.jpg`.

**Step 3: Commit**

```bash
cd /Users/danielharris/Desktop/Flag/talkinflag && git add src/app/media/page.tsx && git commit -m "Drop the Behind the Mic shot so the gallery columns even out

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 2: Migration — `media_instagram_posts`, seeded with today's 9

**Files:**
- Create: `supabase/migrations/027_media_instagram_posts.sql`

**Step 1: Write the migration**

```sql
-- Admin-curated Instagram grid for /media. Replaces the hardcoded
-- INSTAGRAM_POSTS array in src/app/media/page.tsx (kept there as a fallback).
-- Exactly 9 rows are shown live; retired reels stay as is_live = false.
CREATE TABLE IF NOT EXISTS media_instagram_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shortcode TEXT UNIQUE NOT NULL,           -- e.g. 'DKULB7cNxpR'
  label TEXT NOT NULL DEFAULT '',           -- admin-facing note, e.g. 'Most popular · 20.4K likes'
  position INT NOT NULL DEFAULT 0,          -- 0-8 left-to-right in the 3x3 grid
  is_live BOOLEAN NOT NULL DEFAULT TRUE,    -- false = retired, kept for re-use
  -- Performance numbers Ambra reads off Instagram Insights by hand. No API can
  -- fill these without Meta App Review (see docs/plans/2026-08-07-admin-command-center.md).
  plays INT,
  likes INT,
  metrics_captured_on DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_media_ig_live_pos ON media_instagram_posts(is_live, position);

ALTER TABLE media_instagram_posts ENABLE ROW LEVEL SECURITY;
-- Public may read only live rows; every write goes through the service-role
-- client in admin code, never the cookie client.
CREATE POLICY media_instagram_posts_public_read ON media_instagram_posts
  FOR SELECT USING (is_live = TRUE);

-- Seed with the 9 shortcodes currently hardcoded, in their current order, so
-- /media renders identically the moment this ships.
INSERT INTO media_instagram_posts (shortcode, label, position) VALUES
  ('DKULB7cNxpR', 'Most popular · 20.4K likes',        0),
  ('DHHVMyKN9Qw', 'Popular · 8.5K likes',              1),
  ('DZIWIHgt8bq', 'Fiesta Bowl Flag Football Classic', 2),
  ('DY2T9iytnox', 'Flag football is already here',     3),
  ('DZNRMgSDZOs', 'S3 Episode 20 · EFAF',              4),
  ('DZFuHE0jdPw', 'Brazil Nation Spotlight',           5),
  ('DZAmA5TDc5e', 'Athletes & coaches',                6),
  ('DY7WHrhDdm5', 'S3 Episode 19 · Fiesta Bowl',       7),
  ('DYztBlcDcBL', 'Jamaica Nation Spotlight',          8)
ON CONFLICT (shortcode) DO NOTHING;
```

**Step 2: Apply it**

Apply through the same route the 025/026 blog migrations used (Supabase SQL editor or the MCP `apply_migration` tool). **Ask Daniel before running it against prod** — per CLAUDE.md nothing goes live without approval.

**Step 3: Verify the seed landed**

Run in the SQL editor:

```sql
SELECT position, shortcode, is_live FROM media_instagram_posts ORDER BY position;
```

Expected: 9 rows, positions 0-8, all `is_live = true`.

**Step 4: Commit**

```bash
cd /Users/danielharris/Desktop/Flag/talkinflag && git add supabase/migrations/027_media_instagram_posts.sql && git commit -m "Give the Instagram grid a table Ambra can edit

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 3: The lib module — parsing and selection (TDD)

This is the only logic worth testing, so it is pure and lives away from the DB. `getLiveInstagramPosts()` (the DB read) goes in the same file but is not unit-tested — it's a query, exactly like `getPublishedDbPosts()` in `src/lib/blog/posts.ts`.

**Files:**
- Create: `src/lib/media/instagram.ts`
- Test: `src/lib/media/instagram.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { parseInstagramShortcode, selectGridPosts, MAX_LIVE_POSTS } from "./instagram";

describe("parseInstagramShortcode", () => {
  it("parses a reel URL", () => {
    expect(parseInstagramShortcode("https://www.instagram.com/reel/DKULB7cNxpR/")).toBe("DKULB7cNxpR");
  });

  it("parses a /reels/ URL", () => {
    expect(parseInstagramShortcode("https://instagram.com/reels/DKULB7cNxpR")).toBe("DKULB7cNxpR");
  });

  it("parses a regular post URL", () => {
    expect(parseInstagramShortcode("https://www.instagram.com/p/DHHVMyKN9Qw/")).toBe("DHHVMyKN9Qw");
  });

  it("strips share/tracking query params", () => {
    expect(
      parseInstagramShortcode("https://www.instagram.com/reel/DZIWIHgt8bq/?igsh=abc123&utm_source=ig_web")
    ).toBe("DZIWIHgt8bq");
  });

  it("accepts a bare shortcode pasted on its own", () => {
    expect(parseInstagramShortcode("DZNRMgSDZOs")).toBe("DZNRMgSDZOs");
  });

  it("trims surrounding whitespace", () => {
    expect(parseInstagramShortcode("  https://www.instagram.com/reel/DY2T9iytnox/  ")).toBe("DY2T9iytnox");
  });

  it("returns null for a non-Instagram URL", () => {
    expect(parseInstagramShortcode("https://youtube.com/watch?v=abc")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(parseInstagramShortcode("")).toBeNull();
  });

  it("returns null for an Instagram profile URL with no post", () => {
    expect(parseInstagramShortcode("https://www.instagram.com/talkinflagshow/")).toBeNull();
  });
});

describe("selectGridPosts", () => {
  const row = (shortcode: string, position: number, is_live = true) => ({
    shortcode,
    label: "",
    position,
    is_live,
  });

  it("returns live posts in position order", () => {
    const out = selectGridPosts([row("c", 2), row("a", 0), row("b", 1)]);
    expect(out.map((p) => p.shortcode)).toEqual(["a", "b", "c"]);
  });

  it("drops retired posts", () => {
    const out = selectGridPosts([row("a", 0), row("dead", 1, false), row("b", 2)]);
    expect(out.map((p) => p.shortcode)).toEqual(["a", "b"]);
  });

  it("caps the grid at 9 even if the table has more live rows", () => {
    const rows = Array.from({ length: 12 }, (_, i) => row(`s${i}`, i));
    expect(selectGridPosts(rows)).toHaveLength(MAX_LIVE_POSTS);
    expect(MAX_LIVE_POSTS).toBe(9);
  });

  it("breaks a position tie deterministically by shortcode", () => {
    const out = selectGridPosts([row("zzz", 0), row("aaa", 0)]);
    expect(out.map((p) => p.shortcode)).toEqual(["aaa", "zzz"]);
  });

  it("returns [] for an empty table", () => {
    expect(selectGridPosts([])).toEqual([]);
  });
});
```

**Step 2: Run it to verify it fails**

```bash
cd /Users/danielharris/Desktop/Flag/talkinflag && npx vitest run src/lib/media/instagram.test.ts
```

Expected: FAIL — `Failed to resolve import "./instagram"`.

**Step 3: Write the implementation**

```ts
import { createAdminClient } from "@/lib/eval/admin-client";

/** The grid is a 3x3. Nine is the product decision, not an incidental limit. */
export const MAX_LIVE_POSTS = 9;

export interface InstagramPost {
  shortcode: string;
  label: string;
  position: number;
  is_live: boolean;
  plays?: number | null;
  likes?: number | null;
  metrics_captured_on?: string | null;
  id?: string;
  updated_at?: string | null;
}

/** Instagram shortcodes are URL-safe base64-ish, typically 11 chars. */
const SHORTCODE_RE = /^[A-Za-z0-9_-]{5,24}$/;
const URL_RE = /instagram\.com\/(?:reels?|p|tv)\/([A-Za-z0-9_-]{5,24})/i;

/**
 * Pull the shortcode out of anything Ambra is likely to paste: a reel URL, a
 * post URL, a URL with an `?igsh=` share param, or the bare code itself.
 * Returns null when there's no post in the input (e.g. a profile URL).
 */
export function parseInstagramShortcode(input: string): string | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;

  const m = raw.match(URL_RE);
  if (m) return m[1];

  // A bare shortcode — but never mistake a URL we failed to match for one.
  if (!raw.includes("/") && !raw.includes(".") && SHORTCODE_RE.test(raw)) return raw;

  return null;
}

/**
 * The public grid: live rows only, in position order, capped at nine.
 * Ties break on shortcode so the order never flickers between renders.
 */
export function selectGridPosts<T extends Pick<InstagramPost, "shortcode" | "position" | "is_live">>(
  rows: T[]
): T[] {
  return rows
    .filter((r) => r.is_live)
    .sort((a, b) => a.position - b.position || a.shortcode.localeCompare(b.shortcode))
    .slice(0, MAX_LIVE_POSTS);
}

/**
 * Hardcoded copy of the seed, used only when the table read fails or returns
 * nothing. The /media grid must never render empty.
 */
export const FALLBACK_POSTS: InstagramPost[] = [
  { shortcode: "DKULB7cNxpR", label: "Most popular · 20.4K likes", position: 0, is_live: true },
  { shortcode: "DHHVMyKN9Qw", label: "Popular · 8.5K likes", position: 1, is_live: true },
  { shortcode: "DZIWIHgt8bq", label: "Fiesta Bowl Flag Football Classic", position: 2, is_live: true },
  { shortcode: "DY2T9iytnox", label: "Flag football is already here", position: 3, is_live: true },
  { shortcode: "DZNRMgSDZOs", label: "S3 Episode 20 · EFAF", position: 4, is_live: true },
  { shortcode: "DZFuHE0jdPw", label: "Brazil Nation Spotlight", position: 5, is_live: true },
  { shortcode: "DZAmA5TDc5e", label: "Athletes & coaches", position: 6, is_live: true },
  { shortcode: "DY7WHrhDdm5", label: "S3 Episode 19 · Fiesta Bowl", position: 7, is_live: true },
  { shortcode: "DYztBlcDcBL", label: "Jamaica Nation Spotlight", position: 8, is_live: true },
];

/** Live grid for the public /media page. Falls back rather than rendering empty. */
export async function getLiveInstagramPosts(): Promise<InstagramPost[]> {
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from("media_instagram_posts")
      .select("*")
      .eq("is_live", true)
      .order("position", { ascending: true });
    if (error) throw new Error(error.message);
    const picked = selectGridPosts((data ?? []) as InstagramPost[]);
    return picked.length > 0 ? picked : FALLBACK_POSTS;
  } catch (e) {
    console.error("getLiveInstagramPosts:", e instanceof Error ? e.message : e);
    return FALLBACK_POSTS;
  }
}

/** Every row, live and retired, for the admin page. */
export async function getAllInstagramPosts(): Promise<InstagramPost[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("media_instagram_posts")
    .select("*")
    .order("is_live", { ascending: false })
    .order("position", { ascending: true });
  if (error) {
    console.error("getAllInstagramPosts:", error.message);
    return [];
  }
  return (data ?? []) as InstagramPost[];
}
```

**Step 4: Run the test to verify it passes**

```bash
cd /Users/danielharris/Desktop/Flag/talkinflag && npx vitest run src/lib/media/instagram.test.ts
```

Expected: PASS, 15 tests.

**Step 5: Commit**

```bash
cd /Users/danielharris/Desktop/Flag/talkinflag && git add src/lib/media/instagram.ts src/lib/media/instagram.test.ts && git commit -m "Parse whatever Instagram URL gets pasted, cap the grid at nine

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 4: Admin server actions

**Files:**
- Create: `src/app/admin/media/actions.ts`

Modelled directly on `src/app/admin/blog/actions.ts`: `"use server"`, `getAdminUser()` gate at the top of every action, service-role client, `revalidatePath`, and an `ActionResult` return instead of throwing.

**Step 1: Write the file**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/eval/admin-client";
import { parseInstagramShortcode, MAX_LIVE_POSTS } from "@/lib/media/instagram";

export type ActionResult = { ok: true } | { ok: false; error: string };

function revalidateMedia() {
  revalidatePath("/media");
  revalidatePath("/admin/media");
}

async function requireAdmin(): Promise<string | null> {
  const user = await getAdminUser();
  return user ? null : "Not authorized.";
}

/** Count of currently-live rows, used to enforce the nine cap. */
async function liveCount(db: ReturnType<typeof createAdminClient>): Promise<number> {
  const { count } = await db
    .from("media_instagram_posts")
    .select("id", { count: "exact", head: true })
    .eq("is_live", true);
  return count ?? 0;
}

/**
 * Add a reel to the grid. Refuses when nine are already live — retiring one
 * first is deliberate: it forces the "which is weakest?" decision.
 */
export async function addPost(input: {
  url: string;
  label?: string;
  plays?: string;
  likes?: string;
}): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return { ok: false, error: denied };

  const shortcode = parseInstagramShortcode(input.url);
  if (!shortcode) {
    return { ok: false, error: "That doesn't look like an Instagram reel or post link." };
  }

  const db = createAdminClient();

  // An existing retired row for this shortcode is revived rather than duplicated.
  const { data: existing } = await db
    .from("media_instagram_posts")
    .select("id, is_live")
    .eq("shortcode", shortcode)
    .maybeSingle();

  if (existing?.is_live) {
    return { ok: false, error: "That reel is already on the page." };
  }

  if ((await liveCount(db)) >= MAX_LIVE_POSTS) {
    return {
      ok: false,
      error: `The grid holds ${MAX_LIVE_POSTS} reels. Retire one first, then add this.`,
    };
  }

  const toInt = (v?: string) => {
    const n = Number.parseInt((v ?? "").replace(/[^0-9]/g, ""), 10);
    return Number.isFinite(n) ? n : null;
  };

  const fields = {
    shortcode,
    label: (input.label ?? "").trim(),
    is_live: true,
    position: MAX_LIVE_POSTS - 1, // lands last; reorder from the list
    plays: toInt(input.plays),
    likes: toInt(input.likes),
    metrics_captured_on: new Date().toISOString().slice(0, 10),
    updated_at: new Date().toISOString(),
  };

  const { error } = existing
    ? await db.from("media_instagram_posts").update(fields).eq("id", existing.id)
    : await db.from("media_instagram_posts").insert(fields);

  if (error) return { ok: false, error: error.message };
  revalidateMedia();
  return { ok: true };
}

/** Take a reel off the page. The row is kept so it can be brought back. */
export async function retirePost(id: string): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return { ok: false, error: denied };

  const db = createAdminClient();
  const { error } = await db
    .from("media_instagram_posts")
    .update({ is_live: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidateMedia();
  return { ok: true };
}

/** Put a retired reel back, if there's room. */
export async function restorePost(id: string): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return { ok: false, error: denied };

  const db = createAdminClient();
  if ((await liveCount(db)) >= MAX_LIVE_POSTS) {
    return {
      ok: false,
      error: `The grid holds ${MAX_LIVE_POSTS} reels. Retire one first.`,
    };
  }
  const { error } = await db
    .from("media_instagram_posts")
    .update({ is_live: true, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidateMedia();
  return { ok: true };
}

/** Edit the note and the hand-entered performance numbers. */
export async function updatePost(
  id: string,
  input: { label?: string; plays?: string; likes?: string }
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return { ok: false, error: denied };

  const toInt = (v?: string) => {
    const n = Number.parseInt((v ?? "").replace(/[^0-9]/g, ""), 10);
    return Number.isFinite(n) ? n : null;
  };

  const db = createAdminClient();
  const { error } = await db
    .from("media_instagram_posts")
    .update({
      label: (input.label ?? "").trim(),
      plays: toInt(input.plays),
      likes: toInt(input.likes),
      metrics_captured_on: new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidateMedia();
  return { ok: true };
}

/** Move a reel one slot earlier or later by swapping positions with its neighbour. */
export async function movePost(id: string, direction: "up" | "down"): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return { ok: false, error: denied };

  const db = createAdminClient();
  const { data: rows, error: readErr } = await db
    .from("media_instagram_posts")
    .select("id, position")
    .eq("is_live", true)
    .order("position", { ascending: true });

  if (readErr) return { ok: false, error: readErr.message };

  const list = rows ?? [];
  const i = list.findIndex((r) => r.id === id);
  if (i === -1) return { ok: false, error: "That reel isn't on the page." };

  const j = direction === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= list.length) return { ok: true }; // already at the end — no-op

  // Rewrite every position from the swapped array. Cheap (nine rows) and it
  // repairs any duplicate or gapped positions left by earlier edits.
  [list[i], list[j]] = [list[j], list[i]];
  for (let k = 0; k < list.length; k++) {
    const { error } = await db
      .from("media_instagram_posts")
      .update({ position: k, updated_at: new Date().toISOString() })
      .eq("id", list[k].id);
    if (error) return { ok: false, error: error.message };
  }

  revalidateMedia();
  return { ok: true };
}
```

**Step 2: Typecheck**

```bash
cd /Users/danielharris/Desktop/Flag/talkinflag && npx tsc --noEmit
```

Expected: no errors (the pre-existing `tsconfig.tsbuildinfo` may update; that's fine).

**Step 3: Commit**

```bash
cd /Users/danielharris/Desktop/Flag/talkinflag && git add src/app/admin/media/actions.ts && git commit -m "Admin actions: add, retire, restore, reorder the nine

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 5: The `/admin/media` page

**Files:**
- Create: `src/app/admin/media/page.tsx`
- Create: `src/app/admin/media/InstagramGridEditor.tsx`

The page is a server component (admin gate + data fetch, same shape as `src/app/admin/blog/page.tsx`); the editor is the `"use client"` piece that calls the actions.

**Step 1: Write the server page**

```tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminUser } from "@/lib/admin";
import { getAllInstagramPosts, MAX_LIVE_POSTS } from "@/lib/media/instagram";
import { InstagramGridEditor } from "./InstagramGridEditor";

export const dynamic = "force-dynamic";

/** Days since the most recent edit to any row — drives the staleness nag. */
function daysSinceLastCuration(rows: { updated_at?: string | null }[]): number | null {
  const stamps = rows
    .map((r) => (r.updated_at ? new Date(r.updated_at).getTime() : NaN))
    .filter((t) => Number.isFinite(t));
  if (stamps.length === 0) return null;
  return Math.floor((Date.now() - Math.max(...stamps)) / 86_400_000);
}

export default async function AdminMediaPage() {
  if (!(await getAdminUser())) redirect("/");

  const rows = await getAllInstagramPosts();
  const live = rows.filter((r) => r.is_live);
  const retired = rows.filter((r) => !r.is_live);
  const staleDays = daysSinceLastCuration(rows);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="border-l-4 border-[#FDDD58] pl-6 mb-8">
        <h1 className="font-display text-4xl uppercase text-white leading-none mt-1">Media</h1>
        <p className="text-white/40 mt-2 text-sm">
          The {MAX_LIVE_POSTS} reels on{" "}
          <Link href="/media" className="text-[#FDDD58] hover:underline">
            talkinflag.com/media
          </Link>
          . {live.length} of {MAX_LIVE_POSTS} slots used.
        </p>
      </div>

      {/* The monthly job, spelled out — this page is the only place it's written down. */}
      <div className="bg-[#0d0d0d] border border-white/10 p-6 mb-8">
        <p className="font-display text-xs uppercase tracking-[0.25em] text-[#FDDD58] mb-3">
          Once a month
        </p>
        <ol className="text-white/50 text-sm space-y-1 list-decimal list-inside">
          <li>Instagram app → Professional dashboard → Insights → Reels → sort by Plays (last 90 days).</li>
          <li>If a reel beat one on this page, copy its link.</li>
          <li>Retire the weakest one below, then paste the new link in.</li>
        </ol>
        {staleDays !== null && (
          <p className={`text-xs mt-4 ${staleDays > 35 ? "text-amber-400" : "text-white/30"}`}>
            Last curated {staleDays} {staleDays === 1 ? "day" : "days"} ago
            {staleDays > 35 ? " — worth a check." : "."}
          </p>
        )}
      </div>

      <InstagramGridEditor live={live} retired={retired} />
    </div>
  );
}
```

**Step 2: Write the client editor**

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { InstagramPost } from "@/lib/media/instagram";
import { addPost, retirePost, restorePost, movePost, updatePost } from "./actions";

const BTN =
  "border border-white/15 text-white/60 font-display uppercase tracking-widest px-3 py-1.5 text-[10px] hover:border-white/30 hover:text-white transition-colors disabled:opacity-40";

export function InstagramGridEditor({
  live,
  retired,
}: {
  live: InstagramPost[];
  retired: InstagramPost[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [plays, setPlays] = useState("");

  function run(fn: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-10">
      {error && (
        <p className="border border-red-500/40 text-red-300 text-sm px-4 py-3">{error}</p>
      )}

      {/* Add */}
      <section className="bg-[#0d0d0d] border border-white/10 p-6">
        <p className="font-display text-xs uppercase tracking-[0.25em] text-white/30 mb-4">
          Add a reel
        </p>
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_120px_auto]">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste the Instagram link"
            className="bg-black border border-white/15 text-white text-sm px-3 py-2 placeholder:text-white/25"
          />
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Note (optional)"
            className="bg-black border border-white/15 text-white text-sm px-3 py-2 placeholder:text-white/25"
          />
          <input
            value={plays}
            onChange={(e) => setPlays(e.target.value)}
            placeholder="Plays"
            inputMode="numeric"
            className="bg-black border border-white/15 text-white text-sm px-3 py-2 placeholder:text-white/25"
          />
          <button
            type="button"
            disabled={pending || !url.trim()}
            onClick={() =>
              run(async () => {
                const res = await addPost({ url, label, plays });
                if (res.ok) {
                  setUrl("");
                  setLabel("");
                  setPlays("");
                }
                return res;
              })
            }
            className="bg-[#FDDD58] text-black font-display uppercase tracking-widest px-5 py-2 text-xs disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </section>

      {/* Live grid */}
      <section>
        <p className="font-display text-xs uppercase tracking-[0.25em] text-white/30 mb-4">
          On the page
        </p>
        <ul className="space-y-2">
          {live.map((p, i) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center gap-3 bg-[#0d0d0d] border border-white/10 px-4 py-3"
            >
              <span className="font-display text-[#FDDD58] text-sm w-6">{i + 1}</span>
              <a
                href={`https://www.instagram.com/reel/${p.shortcode}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white text-sm hover:text-[#FDDD58] transition-colors"
              >
                {p.label || p.shortcode}
              </a>
              {p.plays != null && (
                <span className="text-white/30 text-xs">{p.plays.toLocaleString()} plays</span>
              )}
              <span className="flex-1" />
              <button type="button" disabled={pending || i === 0} className={BTN}
                onClick={() => run(() => movePost(p.id!, "up"))}>↑</button>
              <button type="button" disabled={pending || i === live.length - 1} className={BTN}
                onClick={() => run(() => movePost(p.id!, "down"))}>↓</button>
              <button type="button" disabled={pending} className={BTN}
                onClick={() => run(() => updatePost(p.id!, { label: p.label, plays: String(p.plays ?? "") }))}>
                Touch
              </button>
              <button type="button" disabled={pending} className={BTN}
                onClick={() => run(() => retirePost(p.id!))}>Retire</button>
            </li>
          ))}
        </ul>
      </section>

      {/* Retired */}
      {retired.length > 0 && (
        <section>
          <p className="font-display text-xs uppercase tracking-[0.25em] text-white/30 mb-4">
            Retired — kept, not deleted
          </p>
          <ul className="space-y-2">
            {retired.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 bg-[#0d0d0d] border border-white/5 px-4 py-3"
              >
                <a
                  href={`https://www.instagram.com/reel/${p.shortcode}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/40 text-sm hover:text-white transition-colors"
                >
                  {p.label || p.shortcode}
                </a>
                <span className="flex-1" />
                <button type="button" disabled={pending} className={BTN}
                  onClick={() => run(() => restorePost(p.id!))}>Put back</button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
```

**Step 3: Typecheck and lint**

```bash
cd /Users/danielharris/Desktop/Flag/talkinflag && npx tsc --noEmit && npm run lint
```

Expected: both clean.

**Step 4: Commit**

```bash
cd /Users/danielharris/Desktop/Flag/talkinflag && git add src/app/admin/media && git commit -m "Give Ambra a page to swap the reels herself

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 6: Point the public `/media` page at the table

**Files:**
- Modify: `src/app/media/page.tsx`

**Step 1: Replace the hardcoded array with the DB read**

Delete the `INSTAGRAM_POSTS` const and its comment block (the fallback now lives in the lib), add the import and `revalidate`, and make the component `async`:

```tsx
import { getLiveInstagramPosts } from "@/lib/media/instagram";

export const revalidate = 300;
```

```tsx
export default async function MediaPage() {
  const instagramPosts = await getLiveInstagramPosts();
```

Then change the grid map from `INSTAGRAM_POSTS.map(...)` to `instagramPosts.map(...)`. Everything inside the map is unchanged — it already only destructures `shortcode`.

**Step 2: Typecheck**

```bash
cd /Users/danielharris/Desktop/Flag/talkinflag && npx tsc --noEmit && npm run lint
```

Expected: clean. If lint flags an unused `INSTAGRAM_POSTS`, you missed deleting it.

**Step 3: Commit**

```bash
cd /Users/danielharris/Desktop/Flag/talkinflag && git add src/app/media/page.tsx && git commit -m "Read the reel grid from the table, fall back to the nine we shipped

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 7: Add the Media tile to `/admin`

**Files:**
- Modify: `src/app/admin/page.tsx` (the `sections` array, ~line 94)

**Step 1: Add the tile**

Insert directly after the existing **Blog** entry (~line 110-118) so it sits with the other content surfaces — and per the command-center plan's rule, nothing she already knows how to find moves:

```ts
{
  label: "Media",
  description: "The 9 Instagram reels on the Media page",
  href: "/admin/media",
  count: 0,
},
```

Match the exact shape of the neighbouring entries — read them first; if `Blog` sets `tour` or `badge`, decide whether Media needs them (it does not).

**Step 2: Verify it renders**

```bash
cd /Users/danielharris/Desktop/Flag/talkinflag && npx tsc --noEmit
```

Expected: clean.

**Step 3: Commit**

```bash
cd /Users/danielharris/Desktop/Flag/talkinflag && git add src/app/admin/page.tsx && git commit -m "Surface Media on the admin dashboard

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 8: Verify end to end

**Step 1: Full test suite and lint**

```bash
cd /Users/danielharris/Desktop/Flag/talkinflag && npm test && npm run lint && npx tsc --noEmit
```

Expected: all pass.

**Step 2: Run the app**

Use the Browser pane (`preview_start`, never `npm run dev` in Bash). Check `/media`:
- The gallery shows **3** images and no "Behind the mic" tile.
- At `lg` width the masonry columns end level.
- The Instagram grid still shows **9** embeds.

**Step 3: Check the admin page**

Sign in as an admin and open `/admin/media`:
- 9 live rows, numbered 1-9, in the seeded order.
- `↑` is disabled on row 1, `↓` disabled on row 9.
- Paste a 10th reel link → the error reads "The grid holds 9 reels. Retire one first, then add this."
- Retire row 9, then add it back from **Retired** → it returns.
- Paste `https://youtube.com/watch?v=x` → "That doesn't look like an Instagram reel or post link."

**Step 4: Screenshot both pages** and send them to Daniel with `SendUserFile`.

**Step 5: Do NOT push or deploy.** Per CLAUDE.md, nothing goes live without explicit approval. Report what's ready and wait.

---

## Appendix A — "Can Ambra edit the site herself with an AI agent?"

**This is a memo, not a task. Nothing here gets built without Daniel's decision.**

### The short answer

A vibe-coding agent pointed at the live Talkin Flag repo is the wrong tool for what Ambra actually wants. But *what she wants* is achievable — and this plan is the third instance of achieving it.

### Why not a code-writing agent

For Ambra to "make a change" through a coding agent, that agent needs repo write access, a build, and a deploy. Concretely:

| Problem | Why it's serious here |
|---|---|
| **No reviewer in the loop.** The agent writes TSX and pushes. If it's wrong, the public site is wrong. | The site is the E-2 evidence file. A broken `/media` on the day counsel looks is a real cost. |
| **It can't see what it did.** A coding agent can't judge whether a layout now looks right — that's the exact request that started this session. | "The layout is a bit off" is not a prompt an agent can verify itself against. |
| **Every edit is a deploy.** 2-4 minutes, and a failed build leaves the last good version up but the change invisible — the "can't find it" confusion from 2026-08-04, repeated. | Ambra's reported failure mode is already *not finding the thing that shipped*. |
| **Blast radius is unbounded.** "Change the yellow" can touch auth, RLS policy files, or the ranking maths. Nothing scopes an agent to "just the Media page." | Player PII and claim flows live in the same repo. |
| **Cost and access.** It needs a GitHub token, a Vercel token, and an Anthropic key held by a non-engineer. | New secrets to rotate, held by someone who shouldn't have to think about them. |

### What she's actually asking for

Read the three requests in this session: remove a photo, swap some reels. Neither is a code question. Both are **content** questions that were only code questions because the content was hardcoded. The pattern is already proven twice:

- **Blog** (2026-08-04, `490a334`) — 29 posts moved out of code into `blog_posts`; Ambra now writes and publishes with no developer.
- **Instagram grid** (this plan) — 9 shortcodes moved out of code into `media_instagram_posts`.

Each conversion takes roughly one task and removes a whole category of "ask Daniel" forever.

### The recommendation, in order

1. **Keep converting hardcoded content to admin editors, one surface at a time, as Ambra asks.** Highest value remaining: the gallery images themselves (an upload + reorder page, so Task 1 of this plan never needs a developer again), then the home-page hero copy. Roughly one task each, near-zero risk, and every one is a permanent reduction in her dependency on us.
2. **Build the read-only AI assistant already scoped as Phase 2 of [docs/plans/2026-08-07-admin-command-center.md](docs/plans/2026-08-07-admin-command-center.md).** This is the "AI assistant on the admin board" she's picturing. It answers questions about the site's own data in English. It has no write path by construction, so a hallucinated or injected tool call cannot change anything. ~half a session, ~$1-3/month in API cost.
3. **If she genuinely wants to change layout and design** — not content — the correct route is a preview deploy she reviews, not an agent she drives: she describes the change, Claude makes it on a branch, Vercel builds a preview URL, she looks at it, and Daniel merges. Same speed as an agent, with the review step that makes it safe.

**What to decide:** whether to schedule (2), and which surface to convert next under (1). Both are Daniel's calls, not something to start from this plan.

---

*Plan written 2026-09-14. Requests from Ambra Marcucci via Daniel.*
