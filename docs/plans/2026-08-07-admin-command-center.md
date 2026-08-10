# Admin Command Center Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn `/admin` from a list of 12 review-queue links into Ambra's brand command center — one page that answers "how is the brand doing today?", pulls the show's social metrics into the same place as the site metrics, and adds an AI assistant that can answer questions about the site's own data.

**Architecture:** Three phases, each independently shippable. Phase 1 adds two service-only Supabase tables (`brand_social_accounts`, `brand_metric_snapshots`), a YouTube auto-sync using the API key already in prod, a manual-entry form for Instagram/TikTok, and a rebuilt `/admin` page. Phase 2 adds a read-only Claude assistant as a Next.js route handler with a small tool set over the existing admin queries. Phase 3 (OAuth social connections, write-capable assistant) is scoped but **deliberately not built now**.

**Tech Stack:** Next.js 16 App Router · TypeScript · Tailwind · Supabase (service-role client) · Vitest · `@anthropic-ai/sdk` (Phase 2 only) · YouTube Data API v3 (existing key)

---

## PM Section — Read This Before Writing Code

### The 10x claim, made concrete

"10x the dashboard" is not 10x more tiles. Today `/admin` is a **queue index**: 8 stat cards + 12 links. It answers "what needs approving?" It does not answer any of the questions the owner of a media brand actually asks:

| Question Ambra has | Answerable today? | After Phase 1 |
|---|---|---|
| Is the audience growing? | No | Yes — 7d/30d deltas on members, players, evals, socials |
| How is the show doing on YouTube/IG/TikTok? | No | Yes — one row per platform, with trend |
| What changed since I last logged in? | No | Yes — "Since your last visit" brief |
| What should I do right now? | Partly (pending chips) | Yes — brief ranks by urgency |
| Did the blog post I published get traffic? | No | Phase 3 (needs web analytics) |

That's the 10x: **from queue index → decision surface**.

### The expensive part, named up front

**Social OAuth is the single biggest cost in this request, and it is mostly not engineering time.**

| Platform | What "connect the account" actually requires | Realistic time |
|---|---|---|
| **YouTube** | Nothing new. `YOUTUBE_API_KEY` + `YOUTUBE_CHANNEL_ID` are already live in Vercel. Public channel stats (subs, views, video count) need **no OAuth at all**. | **~1 hour** |
| **Instagram** | Meta developer app → IG account converted to Business/Creator → linked to a Facebook Page → Instagram Graph API → **App Review** for `instagram_basic` + `instagram_manage_insights`, with a screencast and a privacy-policy URL | 2–6 weeks of calendar time, mostly waiting on Meta; owner (Ambra) must do the account work, not Claude |
| **TikTok** | TikTok for Developers app → Display API / Research API → app review → tokens expire and need refresh plumbing | 2–4 weeks, same shape |
| **X/Twitter** | Paid API tier ($100+/mo) for anything useful | Not worth it |

So: **YouTube is nearly free, everything else is an owner-blocked, multi-week approval process with token-refresh maintenance forever after.**

The plan's answer is a **manual-entry fallback that produces the same data shape as an API sync.** Ambra opens `/admin/social`, types today's IG follower count from her phone (10 seconds), and the dashboard, the trend chart, and the AI assistant all work identically. When (if) OAuth ever lands in Phase 3, it writes to the same `brand_metric_snapshots` table and every consumer keeps working unchanged. This is the decision that keeps the build inside one session instead of one month.

### The AI assistant, scoped honestly

"A digital AI assistant that helps them manage the website" splits into two very different products:

| | **Read-only analyst (Phase 2 — build this)** | **Write-capable agent (Phase 3 — don't)** |
|---|---|---|
| What it does | Answers questions about the site's data, drafts copy, explains rankings | Approves players, publishes posts, edits profiles |
| Build cost | ~half a session | Days, plus a confirmation UI, plus an audit log |
| Blast radius if wrong | A wrong sentence | A wrongly approved profile, a published draft, deleted data |
| Reversibility | Total | Some actions aren't reversible |

Phase 2 gives ~90% of the felt value ("just ask it") for ~15% of the cost and ~0% of the risk. The tools are read-only by construction — the executor has no write path, so a prompt-injected or hallucinated call cannot mutate anything.

### Pros and cons of the whole effort

**Pros**
- Ambra gets a reason to log in daily instead of only when told there's a queue to clear. Owner engagement is the actual bottleneck on this project (cf. the blog feature she couldn't find for two days).
- Manual metric entry is *not* a hack — it produces a real longitudinal dataset from day one. Even a fully-approved Meta app can't backfill history you never recorded.
- Every piece is additive. Nothing existing is removed or refactored; `/admin` gains sections.
- The AI assistant is the cheapest possible route to "she can ask the site questions in English," and its tools reuse queries `/admin` already runs.

**Cons / risks**
- **Manual entry decays.** If Ambra stops typing IG numbers, the trend line goes stale and silently misleads. *Mitigation:* every metric renders its `captured_on` date and greys out past 14 days; the brief nags when a platform is stale.
- **Anthropic API is a new recurring cost.** Opus 5 is $5/$25 per MTok; an admin asking ~20 questions/day with a ~4K-token context is roughly $1–3/month. Small, but it's a new bill and a new key to rotate. *Mitigation:* rate-limit per admin, cap `max_tokens`, and the feature degrades to a clear "assistant unavailable" message if `ANTHROPIC_API_KEY` is unset.
- **A dashboard rewrite risks breaking a surface Ambra just learned.** *Mitigation:* the existing 12 section links stay, in the same order, below the new sections. Nothing she knows how to find moves.
- **Scope creep is the real threat here.** "Command center" invites endlessly more panels. Phase 1 is deliberately five sections and no more.
- **`brand_metric_snapshots` will be thin for weeks.** Trend lines need ≥2 points. Days 1–7 will look empty. *Mitigation:* Task 4 seeds today's numbers on first save, and the UI says "collecting — check back in a week" rather than rendering a one-point chart.

### Recommended cut

| Phase | Contents | Est. | Ship? |
|---|---|---|---|
| **1** | Metrics schema, YouTube auto-sync, manual entry, rebuilt `/admin` | ~1 session | **Yes, now** |
| **2** | Read-only AI assistant on `/admin` | ~½ session | **Yes, right after** |
| **3** | IG/TikTok OAuth, write-capable assistant, web analytics | weeks, owner-blocked | **No — revisit after Ambra has used 1+2 for a month** |

If time is tighter than that, **Phase 1 Tasks 1–7 alone still delivers the 10x**; the assistant can wait.

---

## Phase 1 — The Command Center

### Task 0: Branch and baseline

**Step 1: Create the branch**

```bash
cd /Users/danielharris/Desktop/Flag/talkinflag
git checkout main && git pull
git checkout -b admin-command-center
```

**Step 2: Confirm a green baseline before changing anything**

```bash
npx tsc --noEmit && npm test
```

Expected: tsc clean, all tests pass (393/393 as of `764db56`). If this is red, stop and report — do not build on a broken baseline.

---

### Task 1: Metrics schema

Two tables. Both get RLS enabled with **zero policies** — that is this repo's convention for "service-role only" (see `src/lib/supabase/usage-guard.test.ts`). A cookie client must never touch them.

**Files:**
- Create: `supabase/migrations/027_brand_metrics.sql`
- Modify: `src/lib/supabase/usage-guard.test.ts:22-27` (the `SERVICE_ONLY` set)

**Step 1: Write the migration**

Create `supabase/migrations/027_brand_metrics.sql`:

```sql
-- Brand command center: social account registry + longitudinal metric snapshots.
-- Both tables are SERVICE-ONLY (RLS on, zero policies) — admin code must use
-- createAdminClient(). See src/lib/supabase/usage-guard.test.ts.

create table if not exists brand_social_accounts (
  id uuid primary key default gen_random_uuid(),
  platform text not null unique
    check (platform in ('youtube','instagram','tiktok','x','facebook')),
  handle text not null,
  profile_url text,
  -- 'api' = auto-synced (YouTube today); 'manual' = owner types the numbers.
  connection_type text not null default 'manual'
    check (connection_type in ('manual','api')),
  is_active boolean not null default true,
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists brand_metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  captured_on date not null,
  followers integer,
  views bigint,
  posts integer,
  source text not null default 'manual' check (source in ('manual','api')),
  created_at timestamptz not null default now(),
  -- One snapshot per platform per day; re-saving the same day overwrites.
  unique (platform, captured_on)
);

create index if not exists brand_metric_snapshots_platform_date_idx
  on brand_metric_snapshots (platform, captured_on desc);

alter table brand_social_accounts enable row level security;
alter table brand_metric_snapshots enable row level security;

-- Seed the show's known accounts. Handles are placeholders the owner edits in
-- /admin/social; only YouTube is api-connected (key already live in Vercel).
insert into brand_social_accounts (platform, handle, connection_type)
values
  ('youtube',   'talkinflag', 'api'),
  ('instagram', 'talkinflag', 'manual'),
  ('tiktok',    'talkinflag', 'manual')
on conflict (platform) do nothing;
```

**Step 2: Update the usage guard test to expect the new service-only tables**

In `src/lib/supabase/usage-guard.test.ts`, add both table names to `SERVICE_ONLY` (keep alphabetical grouping):

```typescript
const SERVICE_ONLY = new Set([
  "brand_metric_snapshots", "brand_social_accounts",
  "career_updates", "claim_events", "contact_submissions", "eval_items",
  "event_results", "events", "form_drafts", "guests",
  "iq_questions", "newsletter_subscribers",
  "players", "profile_reports", "recruiters",
]);
```

**Step 3: Run the guard test**

```bash
npx vitest run src/lib/supabase/usage-guard.test.ts
```

Expected: PASS. (It passes because no code queries the new tables yet — it will keep passing only as long as every later task uses `createAdminClient()`.)

**Step 4: Apply the migration to the live project**

Apply `027_brand_metrics.sql` against Supabase project `wxeuybksowhncalrnttl` via the Supabase MCP `apply_migration` tool. Then verify:

```sql
select tablename, rowsecurity from pg_tables
where schemaname='public' and tablename like 'brand_%';
select platform, connection_type from brand_social_accounts order by platform;
```

Expected: 2 rows with `rowsecurity = true`; 3 seeded accounts (instagram/manual, tiktok/manual, youtube/api).

**Step 5: Commit**

```bash
git add supabase/migrations/027_brand_metrics.sql src/lib/supabase/usage-guard.test.ts
git commit -m "feat: brand metrics schema (social accounts + daily snapshots)"
```

---

### Task 2: Pure metric helpers

All the arithmetic the dashboard needs, with zero I/O, so it is trivially testable.

**Files:**
- Create: `src/lib/brand/metrics.ts`
- Test: `src/lib/brand/metrics.test.ts`

**Step 1: Write the failing test**

Create `src/lib/brand/metrics.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { deltaBetween, isStale, formatCount, latestPerPlatform } from "./metrics";

describe("deltaBetween", () => {
  it("returns absolute and percent change", () => {
    expect(deltaBetween(1200, 1000)).toEqual({ abs: 200, pct: 20 });
  });

  it("handles a decline", () => {
    expect(deltaBetween(900, 1000)).toEqual({ abs: -100, pct: -10 });
  });

  it("returns null when there is no prior value to compare against", () => {
    expect(deltaBetween(1000, null)).toBeNull();
  });

  it("returns null percent when the prior value is zero (no division by zero)", () => {
    expect(deltaBetween(50, 0)).toEqual({ abs: 50, pct: null });
  });
});

describe("isStale", () => {
  const today = new Date("2026-08-07T12:00:00Z");

  it("is not stale within 14 days", () => {
    expect(isStale("2026-08-01", today)).toBe(false);
  });

  it("is stale past 14 days", () => {
    expect(isStale("2026-07-01", today)).toBe(true);
  });

  it("treats a missing date as stale", () => {
    expect(isStale(null, today)).toBe(true);
  });
});

describe("formatCount", () => {
  it("leaves small numbers alone", () => {
    expect(formatCount(842)).toBe("842");
  });

  it("abbreviates thousands", () => {
    expect(formatCount(12400)).toBe("12.4K");
  });

  it("abbreviates millions", () => {
    expect(formatCount(2_300_000)).toBe("2.3M");
  });

  it("renders an em dash for null", () => {
    expect(formatCount(null)).toBe("—");
  });
});

describe("latestPerPlatform", () => {
  it("keeps only the newest snapshot per platform", () => {
    const rows = [
      { platform: "youtube", captured_on: "2026-08-01", followers: 100 },
      { platform: "youtube", captured_on: "2026-08-05", followers: 130 },
      { platform: "instagram", captured_on: "2026-08-03", followers: 900 },
    ];
    const out = latestPerPlatform(rows);
    expect(out.youtube?.followers).toBe(130);
    expect(out.instagram?.followers).toBe(900);
  });

  it("returns an empty map for no rows", () => {
    expect(latestPerPlatform([])).toEqual({});
  });
});
```

**Step 2: Run it and watch it fail**

```bash
npx vitest run src/lib/brand/metrics.test.ts
```

Expected: FAIL — `Failed to resolve import "./metrics"`.

**Step 3: Write the implementation**

Create `src/lib/brand/metrics.ts`:

```typescript
/** Pure helpers for brand metric display. No I/O — see metrics.test.ts. */

export type Snapshot = {
  platform: string;
  captured_on: string;
  followers?: number | null;
  views?: number | null;
  posts?: number | null;
};

export type Delta = { abs: number; pct: number | null };

/**
 * Change from `prior` to `current`. `pct` is null when prior is 0 or unknown,
 * so callers render "new" rather than an infinite percentage.
 */
export function deltaBetween(current: number, prior: number | null | undefined): Delta | null {
  if (prior === null || prior === undefined) return null;
  const abs = current - prior;
  const pct = prior === 0 ? null : Math.round((abs / prior) * 1000) / 10;
  return { abs, pct };
}

/** A metric older than 14 days is not worth trusting on a dashboard. */
export function isStale(capturedOn: string | null | undefined, now = new Date()): boolean {
  if (!capturedOn) return true;
  const then = new Date(`${capturedOn}T00:00:00Z`).getTime();
  if (Number.isNaN(then)) return true;
  return now.getTime() - then > 14 * 864e5;
}

/** 12400 → "12.4K". Null renders as an em dash, never "0". */
export function formatCount(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/** Collapse a snapshot list to the newest row per platform. */
export function latestPerPlatform(rows: Snapshot[]): Record<string, Snapshot> {
  const out: Record<string, Snapshot> = {};
  for (const row of rows) {
    const held = out[row.platform];
    if (!held || row.captured_on > held.captured_on) out[row.platform] = row;
  }
  return out;
}
```

**Step 4: Run the tests**

```bash
npx vitest run src/lib/brand/metrics.test.ts
```

Expected: PASS (14 tests).

**Step 5: Commit**

```bash
git add src/lib/brand/metrics.ts src/lib/brand/metrics.test.ts
git commit -m "feat: pure brand metric helpers (delta, staleness, formatting)"
```

---

### Task 3: YouTube stats fetcher

The one platform we can sync for free. `YOUTUBE_API_KEY` and `YOUTUBE_CHANNEL_ID` are already set in Vercel — public channel statistics need no OAuth.

**Files:**
- Create: `src/lib/brand/youtube-stats.ts`
- Test: `src/lib/brand/youtube-stats.test.ts`

**Step 1: Write the failing test**

Create `src/lib/brand/youtube-stats.test.ts`:

```typescript
import { describe, it, expect, vi, afterEach } from "vitest";
import { parseChannelStats, fetchYouTubeStats } from "./youtube-stats";

describe("parseChannelStats", () => {
  it("pulls subscriber, view and video counts out of the API shape", () => {
    const payload = {
      items: [{ statistics: { subscriberCount: "1234", viewCount: "98765", videoCount: "42" } }],
    };
    expect(parseChannelStats(payload)).toEqual({ followers: 1234, views: 98765, posts: 42 });
  });

  it("returns null when the channel has no items", () => {
    expect(parseChannelStats({ items: [] })).toBeNull();
  });

  it("returns null for a malformed payload rather than throwing", () => {
    expect(parseChannelStats({})).toBeNull();
    expect(parseChannelStats(null)).toBeNull();
  });

  it("treats a hidden subscriber count as null, not zero", () => {
    const payload = { items: [{ statistics: { viewCount: "500", videoCount: "3" } }] };
    expect(parseChannelStats(payload)).toEqual({ followers: null, views: 500, posts: 3 });
  });
});

describe("fetchYouTubeStats", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns null when env vars are missing (feature simply stays off)", async () => {
    expect(await fetchYouTubeStats("", "")).toBeNull();
  });

  it("returns null on a non-OK response instead of throwing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));
    expect(await fetchYouTubeStats("key", "chan")).toBeNull();
  });

  it("returns parsed stats on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [{ statistics: { subscriberCount: "7", viewCount: "8", videoCount: "9" } }],
        }),
      }),
    );
    expect(await fetchYouTubeStats("key", "chan")).toEqual({ followers: 7, views: 8, posts: 9 });
  });
});
```

**Step 2: Run it and watch it fail**

```bash
npx vitest run src/lib/brand/youtube-stats.test.ts
```

Expected: FAIL — module not found.

**Step 3: Write the implementation**

Create `src/lib/brand/youtube-stats.ts`:

```typescript
/**
 * Public YouTube channel statistics. Uses the API key already in Vercel —
 * no OAuth, because channel statistics are public data.
 *
 * Every failure path returns null: a metrics sync must never take down the
 * admin dashboard.
 */

export type ChannelStats = {
  followers: number | null;
  views: number | null;
  posts: number | null;
};

function toNum(v: unknown): number | null {
  if (typeof v !== "string" && typeof v !== "number") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function parseChannelStats(payload: unknown): ChannelStats | null {
  if (!payload || typeof payload !== "object") return null;
  const items = (payload as { items?: unknown }).items;
  if (!Array.isArray(items) || items.length === 0) return null;
  const stats = (items[0] as { statistics?: Record<string, unknown> })?.statistics;
  if (!stats || typeof stats !== "object") return null;
  return {
    // subscriberCount is absent when the channel hides it — null, not 0.
    followers: toNum(stats.subscriberCount),
    views: toNum(stats.viewCount),
    posts: toNum(stats.videoCount),
  };
}

export async function fetchYouTubeStats(
  apiKey: string | undefined,
  channelId: string | undefined,
): Promise<ChannelStats | null> {
  if (!apiKey || !channelId) return null;
  const url =
    `https://www.googleapis.com/youtube/v3/channels` +
    `?part=statistics&id=${encodeURIComponent(channelId)}&key=${encodeURIComponent(apiKey)}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return parseChannelStats(await res.json());
  } catch {
    return null;
  }
}
```

**Step 4: Run the tests**

```bash
npx vitest run src/lib/brand/youtube-stats.test.ts
```

Expected: PASS (7 tests).

**Step 5: Commit**

```bash
git add src/lib/brand/youtube-stats.ts src/lib/brand/youtube-stats.test.ts
git commit -m "feat: YouTube channel stats fetcher (no OAuth needed)"
```

---

### Task 4: Server actions for social accounts and snapshots

**Files:**
- Create: `src/app/admin/social/actions.ts`

**Step 1: Write the actions**

Create `src/app/admin/social/actions.ts`:

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/eval/admin-client";
import { fetchYouTubeStats } from "@/lib/brand/youtube-stats";

/** Today in UTC as YYYY-MM-DD — the snapshot key. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function num(form: FormData, key: string): number | null {
  const raw = String(form.get(key) ?? "").trim();
  if (!raw) return null;
  const n = Number(raw.replace(/,/g, ""));
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

/** Owner edits the handle / profile URL for a platform. */
export async function updateAccount(form: FormData) {
  if (!(await getAdminUser())) throw new Error("Not authorized");
  const platform = String(form.get("platform") ?? "");
  if (!platform) throw new Error("platform required");

  const db = createAdminClient();
  const { error } = await db
    .from("brand_social_accounts")
    .update({
      handle: String(form.get("handle") ?? "").trim(),
      profile_url: String(form.get("profile_url") ?? "").trim() || null,
      is_active: form.get("is_active") === "on",
    })
    .eq("platform", platform);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/social");
  revalidatePath("/admin");
}

/**
 * Manual metric entry — the Instagram/TikTok path. Writes the same row shape an
 * API sync would, so every consumer is source-agnostic. Re-saving the same day
 * overwrites (unique on platform+captured_on).
 */
export async function saveSnapshot(form: FormData) {
  if (!(await getAdminUser())) throw new Error("Not authorized");
  const platform = String(form.get("platform") ?? "");
  if (!platform) throw new Error("platform required");

  const db = createAdminClient();
  const { error } = await db.from("brand_metric_snapshots").upsert(
    {
      platform,
      captured_on: today(),
      followers: num(form, "followers"),
      views: num(form, "views"),
      posts: num(form, "posts"),
      source: "manual",
    },
    { onConflict: "platform,captured_on" },
  );
  if (error) throw new Error(error.message);

  revalidatePath("/admin/social");
  revalidatePath("/admin");
}

/**
 * Pull today's YouTube numbers. Safe to call repeatedly — same-day calls
 * overwrite rather than duplicate. Returns a short status string for the UI.
 */
export async function syncYouTube(): Promise<string> {
  if (!(await getAdminUser())) throw new Error("Not authorized");

  const stats = await fetchYouTubeStats(
    process.env.YOUTUBE_API_KEY,
    process.env.YOUTUBE_CHANNEL_ID,
  );
  if (!stats) return "YouTube sync unavailable — check YOUTUBE_API_KEY / YOUTUBE_CHANNEL_ID.";

  const db = createAdminClient();
  const { error } = await db.from("brand_metric_snapshots").upsert(
    { platform: "youtube", captured_on: today(), ...stats, source: "api" },
    { onConflict: "platform,captured_on" },
  );
  if (error) throw new Error(error.message);

  await db
    .from("brand_social_accounts")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("platform", "youtube");

  revalidatePath("/admin/social");
  revalidatePath("/admin");
  return "YouTube synced.";
}
```

**Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: clean.

**Step 3: Commit**

```bash
git add src/app/admin/social/actions.ts
git commit -m "feat: server actions for social accounts + metric snapshots"
```

---

### Task 5: The `/admin/social` page

**Files:**
- Create: `src/app/admin/social/page.tsx`

**Step 1: Write the page**

Create `src/app/admin/social/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/eval/admin-client";
import { formatCount, isStale, latestPerPlatform, deltaBetween } from "@/lib/brand/metrics";
import { updateAccount, saveSnapshot, syncYouTube } from "./actions";

export const dynamic = "force-dynamic";

const PLATFORM_LABEL: Record<string, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X",
  facebook: "Facebook",
};

export default async function SocialPage() {
  if (!(await getAdminUser())) redirect("/");

  const db = createAdminClient();
  const [{ data: accounts }, { data: snapshots }] = await Promise.all([
    db.from("brand_social_accounts").select("*").order("platform"),
    db
      .from("brand_metric_snapshots")
      .select("platform, captured_on, followers, views, posts, source")
      .gte("captured_on", new Date(Date.now() - 60 * 864e5).toISOString().slice(0, 10))
      .order("captured_on", { ascending: false }),
  ]);

  const rows = snapshots ?? [];
  const latest = latestPerPlatform(rows);
  // Oldest row inside the 60-day window, per platform = the comparison point.
  const prior = latestPerPlatform([...rows].reverse());

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="border-l-4 border-[#FDDD58] pl-6 mb-10">
        <h1 className="font-display text-4xl uppercase text-white leading-none">Social</h1>
        <p className="text-white/40 mt-2 text-sm">
          YouTube syncs automatically. For Instagram and TikTok, type today&apos;s numbers —
          takes ten seconds and builds the trend line.
        </p>
      </div>

      <form action={syncYouTube} className="mb-10">
        <button
          type="submit"
          className="bg-[#FDDD58] text-black font-display text-xs uppercase tracking-widest px-4 py-2 hover:bg-[#FDDD58]/90 transition-colors"
        >
          Sync YouTube now
        </button>
      </form>

      <div className="space-y-6">
        {(accounts ?? []).map((a) => {
          const now = latest[a.platform];
          const then = prior[a.platform];
          const d =
            now?.followers != null && then && then.captured_on !== now.captured_on
              ? deltaBetween(now.followers, then.followers)
              : null;
          const stale = isStale(now?.captured_on);

          return (
            <section key={a.platform} className="bg-[#0d0d0d] border border-white/10 p-5">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="font-display text-lg uppercase text-white tracking-wide">
                  {PLATFORM_LABEL[a.platform] ?? a.platform}
                </h2>
                <span className="text-white/30 text-[10px] uppercase tracking-widest">
                  {a.connection_type === "api" ? "Auto-synced" : "Manual entry"}
                </span>
              </div>

              <div className="flex flex-wrap gap-6 mb-5">
                <div>
                  <p className="font-display text-2xl text-white">{formatCount(now?.followers)}</p>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest">Followers</p>
                </div>
                <div>
                  <p className="font-display text-2xl text-white">{formatCount(now?.views)}</p>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest">Views</p>
                </div>
                <div>
                  <p className="font-display text-2xl text-white">{formatCount(now?.posts)}</p>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest">Posts</p>
                </div>
                <div className="min-w-0">
                  <p className={`font-display text-2xl ${stale ? "text-white/30" : "text-[#FDDD58]"}`}>
                    {d ? `${d.abs >= 0 ? "+" : ""}${formatCount(d.abs)}` : "—"}
                  </p>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest">
                    {now?.captured_on ? `as of ${now.captured_on}` : "no data yet"}
                  </p>
                </div>
              </div>

              {stale && (
                <p className="text-[#FDDD58]/70 text-xs mb-4">
                  No fresh reading in the last 14 days — this number may be out of date.
                </p>
              )}

              <form action={saveSnapshot} className="flex flex-wrap items-end gap-3 mb-4">
                <input type="hidden" name="platform" value={a.platform} />
                {(["followers", "views", "posts"] as const).map((field) => (
                  <label key={field} className="text-white/40 text-[10px] uppercase tracking-widest">
                    {field}
                    <input
                      name={field}
                      inputMode="numeric"
                      defaultValue={now?.[field] ?? ""}
                      className="block mt-1 bg-black border border-white/20 text-white px-2 py-1 w-28 text-sm"
                    />
                  </label>
                ))}
                <button
                  type="submit"
                  className="border border-[#FDDD58] text-[#FDDD58] font-display text-xs uppercase tracking-widest px-3 py-2 hover:bg-[#FDDD58] hover:text-black transition-colors"
                >
                  Save today
                </button>
              </form>

              <form action={updateAccount} className="flex flex-wrap items-end gap-3">
                <input type="hidden" name="platform" value={a.platform} />
                <label className="text-white/40 text-[10px] uppercase tracking-widest">
                  Handle
                  <input
                    name="handle"
                    defaultValue={a.handle ?? ""}
                    className="block mt-1 bg-black border border-white/20 text-white px-2 py-1 w-40 text-sm"
                  />
                </label>
                <label className="text-white/40 text-[10px] uppercase tracking-widest">
                  Profile URL
                  <input
                    name="profile_url"
                    defaultValue={a.profile_url ?? ""}
                    className="block mt-1 bg-black border border-white/20 text-white px-2 py-1 w-64 text-sm"
                  />
                </label>
                <label className="text-white/40 text-[10px] uppercase tracking-widest flex items-center gap-2 pb-2">
                  <input type="checkbox" name="is_active" defaultChecked={a.is_active} />
                  Active
                </label>
                <button
                  type="submit"
                  className="text-white/40 font-display text-xs uppercase tracking-widest px-3 py-2 hover:text-white transition-colors"
                >
                  Save account
                </button>
              </form>
            </section>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: clean.

**Step 3: Commit**

```bash
git add src/app/admin/social/page.tsx
git commit -m "feat: /admin/social — accounts, manual metric entry, YouTube sync"
```

---

### Task 6: Nightly YouTube sync cron

So the numbers keep moving without anyone clicking.

**Files:**
- Create: `src/app/api/cron/social-sync/route.ts`
- Modify: `vercel.json`

**Step 1: Write the route**

Create `src/app/api/cron/social-sync/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/eval/admin-client";
import { fetchYouTubeStats } from "@/lib/brand/youtube-stats";

export const dynamic = "force-dynamic";

/**
 * Nightly YouTube snapshot. Gated by CRON_SECRET like every other cron here —
 * middleware does NOT protect /api routes.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const stats = await fetchYouTubeStats(
    process.env.YOUTUBE_API_KEY,
    process.env.YOUTUBE_CHANNEL_ID,
  );
  if (!stats) return NextResponse.json({ synced: false, reason: "youtube_unavailable" });

  const db = createAdminClient();
  const capturedOn = new Date().toISOString().slice(0, 10);
  const { error } = await db.from("brand_metric_snapshots").upsert(
    { platform: "youtube", captured_on: capturedOn, ...stats, source: "api" },
    { onConflict: "platform,captured_on" },
  );
  if (error) return NextResponse.json({ synced: false, error: error.message }, { status: 500 });

  await db
    .from("brand_social_accounts")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("platform", "youtube");

  return NextResponse.json({ synced: true, capturedOn, ...stats });
}
```

**Step 2: Register the cron**

In `vercel.json`, add to the `crons` array:

```json
{ "path": "/api/cron/social-sync", "schedule": "0 5 * * *" }
```

**Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: clean.

**Step 4: Commit**

```bash
git add src/app/api/cron/social-sync/route.ts vercel.json
git commit -m "feat: nightly YouTube metric sync cron"
```

---

### Task 7: Rebuild `/admin` as the command center

The centerpiece. **Additive only** — the existing 12 section links keep their order and stay on the page, below the new sections. Ambra loses no muscle memory.

New layout, top to bottom:
1. **Today's brief** — ranked plain-English sentences ("3 players are waiting on you", "Instagram hasn't been updated in 20 days")
2. **Needs attention chips** (unchanged)
3. **Audience row** — members / players / evals with 7-day deltas
4. **Brand row** — one card per social platform, linking to `/admin/social`
5. **Existing stat cards + section links** (unchanged)

**Files:**
- Create: `src/lib/brand/brief.ts`
- Test: `src/lib/brand/brief.test.ts`
- Modify: `src/app/admin/page.tsx`
- Modify: `src/app/admin/AdminSidebar.tsx:37-40` (add Social under a "Brand" group)

**Step 1: Write the failing test for the brief generator**

Create `src/lib/brand/brief.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { buildBrief } from "./brief";

const base = {
  pendingByLabel: {} as Record<string, number>,
  newMembersThisWeek: 0,
  evalsThisWeek: 0,
  staleSocialPlatforms: [] as string[],
  draftPosts: 0,
};

describe("buildBrief", () => {
  it("leads with the largest pending queue", () => {
    const brief = buildBrief({ ...base, pendingByLabel: { Players: 3, Messages: 1 } });
    expect(brief[0]).toMatch(/3 players/i);
  });

  it("reports growth when members joined this week", () => {
    const brief = buildBrief({ ...base, newMembersThisWeek: 5 });
    expect(brief.join(" ")).toMatch(/5 new members/i);
  });

  it("flags stale social platforms by name", () => {
    const brief = buildBrief({ ...base, staleSocialPlatforms: ["instagram"] });
    expect(brief.join(" ")).toMatch(/instagram/i);
  });

  it("mentions unpublished drafts", () => {
    const brief = buildBrief({ ...base, draftPosts: 2 });
    expect(brief.join(" ")).toMatch(/2 blog drafts/i);
  });

  it("returns an all-clear line when nothing needs doing", () => {
    expect(buildBrief(base)).toEqual(["Nothing needs your attention right now."]);
  });

  it("never returns more than five lines", () => {
    const brief = buildBrief({
      pendingByLabel: { Players: 9, Messages: 8, Coaches: 7, Scouts: 6, Reports: 5 },
      newMembersThisWeek: 4,
      evalsThisWeek: 3,
      staleSocialPlatforms: ["instagram", "tiktok"],
      draftPosts: 2,
    });
    expect(brief.length).toBeLessThanOrEqual(5);
  });
});
```

**Step 2: Run it and watch it fail**

```bash
npx vitest run src/lib/brand/brief.test.ts
```

Expected: FAIL — module not found.

**Step 3: Write the implementation**

Create `src/lib/brand/brief.ts`:

```typescript
/**
 * "Today's brief" — the dashboard's plain-English answer to
 * "what should I do right now?". Pure, so it's testable and reorderable.
 */

export type BriefInput = {
  /** Queue label → pending count, e.g. { Players: 3 }. */
  pendingByLabel: Record<string, number>;
  newMembersThisWeek: number;
  evalsThisWeek: number;
  /** Platforms whose newest snapshot is older than 14 days. */
  staleSocialPlatforms: string[];
  draftPosts: number;
};

const MAX_LINES = 5;

export function buildBrief(input: BriefInput): string[] {
  const lines: string[] = [];

  // Queues first, biggest first — these are the only blocking items.
  const queues = Object.entries(input.pendingByLabel)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
  for (const [label, n] of queues) {
    lines.push(`${n} ${label.toLowerCase()} ${n === 1 ? "is" : "are"} waiting on you.`);
  }

  if (input.newMembersThisWeek > 0) {
    lines.push(
      `${input.newMembersThisWeek} new member${input.newMembersThisWeek === 1 ? "" : "s"} joined this week.`,
    );
  }
  if (input.evalsThisWeek > 0) {
    lines.push(`${input.evalsThisWeek} evaluations were completed this week.`);
  }
  if (input.staleSocialPlatforms.length > 0) {
    lines.push(
      `Update your ${input.staleSocialPlatforms.join(" and ")} numbers — no reading in over two weeks.`,
    );
  }
  if (input.draftPosts > 0) {
    lines.push(
      `${input.draftPosts} blog draft${input.draftPosts === 1 ? "" : "s"} not published yet.`,
    );
  }

  if (lines.length === 0) return ["Nothing needs your attention right now."];
  return lines.slice(0, MAX_LINES);
}
```

**Step 4: Run the tests**

```bash
npx vitest run src/lib/brand/brief.test.ts
```

Expected: PASS (6 tests).

**Step 5: Wire the brief and the brand row into `/admin`**

In `src/app/admin/page.tsx`:

a. Add imports at the top:

```typescript
import { buildBrief } from "@/lib/brand/brief";
import { formatCount, isStale, latestPerPlatform, deltaBetween } from "@/lib/brand/metrics";
```

b. After the existing member-growth `Promise.all` (which ends at line 86 with `publishedPosts`), add the social read:

```typescript
  // Brand metrics — service-only tables, admin client (see usage-guard.test.ts).
  const { data: socialRows } = await adminDb
    .from("brand_metric_snapshots")
    .select("platform, captured_on, followers, views, posts")
    .gte("captured_on", new Date(now - 60 * 864e5).toISOString().slice(0, 10))
    .order("captured_on", { ascending: false });
  const socialLatest = latestPerPlatform(socialRows ?? []);
  const socialPrior = latestPerPlatform([...(socialRows ?? [])].reverse());
```

c. After the `sections` array is declared (it ends at line 175), build the brief from it:

```typescript
  const staleSocialPlatforms = ["instagram", "tiktok", "youtube"].filter((p) =>
    isStale(socialLatest[p]?.captured_on),
  );

  const brief = buildBrief({
    pendingByLabel: Object.fromEntries(sections.filter((s) => s.count > 0).map((s) => [s.label, s.count])),
    newMembersThisWeek: newThisWeek,
    evalsThisWeek: evalsThisWeek ?? 0,
    staleSocialPlatforms,
    draftPosts: draftPosts ?? 0,
  });
```

d. In the JSX, immediately after the header `</div>` (currently line 190) and **before** the "Needs attention" block, insert:

```tsx
      {/* Today's brief — the first thing the owner reads */}
      <section className="border border-white/10 bg-[#0d0d0d] p-5 mb-10">
        <p className="text-white/30 text-[10px] font-display uppercase tracking-widest mb-3">
          Today
        </p>
        <ul className="space-y-1.5">
          {brief.map((line) => (
            <li key={line} className="text-white/80 text-sm">
              {line}
            </li>
          ))}
        </ul>
      </section>
```

e. After the existing stat-card grid closes (currently line 236), insert the brand row:

```tsx
      {/* Brand — the show's social footprint, alongside the site's numbers */}
      <div className="mb-12">
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-white/30 text-[10px] font-display uppercase tracking-widest">
            The Show
          </p>
          <Link
            href="/admin/social"
            className="text-white/40 text-xs hover:text-[#FDDD58] transition-colors"
          >
            Manage accounts →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/10 border border-white/10">
          {["youtube", "instagram", "tiktok"].map((platform) => {
            const nowRow = socialLatest[platform];
            const thenRow = socialPrior[platform];
            const d =
              nowRow?.followers != null && thenRow && thenRow.captured_on !== nowRow.captured_on
                ? deltaBetween(nowRow.followers, thenRow.followers)
                : null;
            const stale = isStale(nowRow?.captured_on);
            return (
              <Link
                key={platform}
                href="/admin/social"
                className="bg-[#0d0d0d] p-5 hover:bg-[#141414] transition-colors min-w-0"
              >
                <p className={`font-display text-3xl ${stale ? "text-white/40" : "text-white"}`}>
                  {formatCount(nowRow?.followers)}
                </p>
                <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1">
                  {platform} followers
                </p>
                <p className={`text-xs mt-1 ${stale ? "text-[#FDDD58]/60" : "text-[#FDDD58]"}`}>
                  {stale
                    ? "needs updating"
                    : d
                      ? `${d.abs >= 0 ? "+" : ""}${formatCount(d.abs)} in 60d`
                      : "collecting…"}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
```

**Step 6: Add the sidebar entry**

This is the lesson from the 2026-08-04 blog incident recorded in CLAUDE.md — a new admin surface needs both a sidebar link *and* a dashboard presence. The dashboard presence is the brand row above; add the sidebar link now.

In `src/app/admin/AdminSidebar.tsx`, insert a new group between "Content" and "Inbox" (after line 40):

```typescript
  {
    group: "Brand",
    items: [{ label: "Social", href: "/admin/social" }],
  },
```

**Step 7: Typecheck and run the full suite**

```bash
npx tsc --noEmit && npm test
```

Expected: tsc clean; all tests pass (393 existing + 27 new).

**Step 8: Commit**

```bash
git add src/lib/brand/brief.ts src/lib/brand/brief.test.ts src/app/admin/page.tsx src/app/admin/AdminSidebar.tsx
git commit -m "feat: rebuild /admin as brand command center (brief + social row)"
```

---

### Task 8: Phase 1 gate

**Step 1: Full verification**

```bash
npx tsc --noEmit && npm test && npm run build
```

Expected: tsc clean, all tests pass, build green with `/admin/social` and `/api/cron/social-sync` in the route list.

**Step 2: Browser click-through**

Start the dev server via the Browser pane (`.claude/launch.json`, port 3000), then verify as a signed-in admin:

- `/admin` renders the brief, the brand row, and every pre-existing section link in its original order
- `/admin/social` — enter a follower count for Instagram, save, confirm it appears on `/admin`
- Click "Sync YouTube now" — confirm real numbers land (or a clear unavailable message if the key is missing locally)
- Resize to 375px — no horizontal scroll on either page

**Step 3: Do NOT merge yet**

Phase 1 and Phase 2 ship together, so Ambra sees one change rather than two. If Phase 2 is being deferred, merge here instead:

```bash
git checkout main && git merge --ff-only admin-command-center && git push
```

---

## Phase 2 — The AI Assistant (read-only)

**Read `claude-api` skill guidance before writing Task 10–11 code.** Key constraints already resolved for this plan: model `claude-opus-5`; `thinking: {type: "adaptive"}`; no `temperature`/`top_p`/`top_k` (they 400); `max_tokens: 16000` for non-streaming.

### Task 9: Dependency and env

**Files:**
- Modify: `package.json`
- Modify: `.env.example`

**Step 1: Install the SDK**

```bash
npm install @anthropic-ai/sdk
```

**Step 2: Document the env var**

Add to `.env.example`:

```
# Anthropic (admin AI assistant). Unset = assistant panel hidden, no errors.
ANTHROPIC_API_KEY=
```

**Step 3: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: add Anthropic SDK for the admin assistant"
```

**OWNER ACTION (blocking for Phase 2 in production):** set `ANTHROPIC_API_KEY` in Vercel (Production + Preview). Until then the panel stays hidden — no broken UI.

---

### Task 10: Read-only tool executor

The security property that makes this cheap: **the executor has no write path.** Every branch is a `select`. A hallucinated or injected tool call cannot mutate anything.

**Files:**
- Create: `src/lib/assistant/tools.ts`
- Test: `src/lib/assistant/tools.test.ts`

**Step 1: Write the failing test**

Create `src/lib/assistant/tools.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { ASSISTANT_TOOLS, isReadOnlyToolName } from "./tools";

describe("ASSISTANT_TOOLS", () => {
  it("exposes exactly the four read-only tools", () => {
    expect(ASSISTANT_TOOLS.map((t) => t.name).sort()).toEqual([
      "get_pending_queues",
      "get_site_stats",
      "get_social_metrics",
      "search_players",
    ]);
  });

  it("gives every tool a description and an object input schema", () => {
    for (const tool of ASSISTANT_TOOLS) {
      expect(tool.description.length).toBeGreaterThan(20);
      expect(tool.input_schema.type).toBe("object");
    }
  });

  it("names no tool with a mutating verb", () => {
    for (const tool of ASSISTANT_TOOLS) {
      expect(tool.name).not.toMatch(/create|update|delete|approve|publish|send|deny/);
    }
  });
});

describe("isReadOnlyToolName", () => {
  it("accepts the declared tools", () => {
    expect(isReadOnlyToolName("get_site_stats")).toBe(true);
  });

  it("rejects anything not declared — the injection guard", () => {
    expect(isReadOnlyToolName("delete_player")).toBe(false);
    expect(isReadOnlyToolName("")).toBe(false);
  });
});
```

**Step 2: Run it and watch it fail**

```bash
npx vitest run src/lib/assistant/tools.test.ts
```

Expected: FAIL — module not found.

**Step 3: Write the implementation**

Create `src/lib/assistant/tools.ts`:

```typescript
import { createAdminClient } from "@/lib/eval/admin-client";
import { latestPerPlatform } from "@/lib/brand/metrics";

/**
 * The admin assistant's tool surface. READ-ONLY BY CONSTRUCTION — every branch
 * of runTool() issues a select and nothing else. Adding a write here changes
 * the security model of the whole feature; don't, without a confirmation UI
 * and an audit log (see Phase 3).
 */
export const ASSISTANT_TOOLS = [
  {
    name: "get_site_stats",
    description:
      "Current totals for the Talkin Flag site: registered members, player profiles, claimed and verified players, completed evaluations, and blog posts. Call this whenever the question is about how big the site is or how it has grown.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "get_pending_queues",
    description:
      "Counts of items awaiting admin review across every queue (players, verifications, coaches, scouts, events, career updates, change requests, claims, reports, contact messages). Call this when asked what needs doing.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "get_social_metrics",
    description:
      "Recorded follower, view and post counts for the show's social accounts, with the date each reading was taken. Call this for any question about the show's social media performance.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "search_players",
    description:
      "Find player profiles by name. Returns name, level, team, claim and verification status, and national ranking. Use for questions about a specific athlete.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Part of the player's first or last name" },
      },
      required: ["query"],
    },
  },
];

const NAMES = new Set(ASSISTANT_TOOLS.map((t) => t.name));

/** Guard: only declared tools may execute. */
export function isReadOnlyToolName(name: string): boolean {
  return NAMES.has(name);
}

export async function runTool(name: string, input: Record<string, unknown>): Promise<string> {
  if (!isReadOnlyToolName(name)) return JSON.stringify({ error: `Unknown tool: ${name}` });
  const db = createAdminClient();

  if (name === "get_site_stats") {
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
    const [members, players, claimed, verified, evals, evalsWeek, published, drafts] =
      await Promise.all([
        db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
        db.from("players").select("id", { count: "exact", head: true }),
        db.from("players").select("id", { count: "exact", head: true }).eq("is_claimed", true),
        db.from("players").select("id", { count: "exact", head: true }).eq("is_verified", true),
        db.from("eval_responses").select("id", { count: "exact", head: true }),
        db.from("eval_responses").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
        db.from("blog_posts").select("id", { count: "exact", head: true }).eq("status", "published"),
        db.from("blog_posts").select("id", { count: "exact", head: true }).eq("status", "draft"),
      ]);
    const users = members.data?.users ?? [];
    return JSON.stringify({
      members: users.length,
      newMembersThisWeek: users.filter((u) => u.created_at >= weekAgo).length,
      players: players.count ?? 0,
      claimedPlayers: claimed.count ?? 0,
      verifiedPlayers: verified.count ?? 0,
      evaluations: evals.count ?? 0,
      evaluationsThisWeek: evalsWeek.count ?? 0,
      publishedPosts: published.count ?? 0,
      draftPosts: drafts.count ?? 0,
    });
  }

  if (name === "get_pending_queues") {
    const [verifications, coaches, scouts, events, messages, career, reports, players, claims, changes] =
      await Promise.all([
        db.from("stat_verifications").select("id", { count: "exact", head: true }).eq("status", "pending"),
        db.from("coaches").select("id", { count: "exact", head: true }).eq("status", "pending"),
        db.from("scout_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
        db.from("events").select("id", { count: "exact", head: true }).eq("is_approved", false).is("rejected_at", null),
        db.from("contact_submissions").select("id", { count: "exact", head: true }).eq("is_read", false).is("archived_at", null),
        db.from("career_updates").select("id", { count: "exact", head: true }).eq("status", "pending"),
        db.from("profile_reports").select("id", { count: "exact", head: true }).eq("status", "open"),
        db.from("players").select("id", { count: "exact", head: true }).eq("review_status", "pending"),
        db.from("players").select("id", { count: "exact", head: true }).eq("claim_pending", true),
        db.from("profile_change_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
    return JSON.stringify({
      verifications: verifications.count ?? 0,
      coaches: coaches.count ?? 0,
      scouts: scouts.count ?? 0,
      events: events.count ?? 0,
      unreadMessages: messages.count ?? 0,
      careerUpdates: career.count ?? 0,
      openReports: reports.count ?? 0,
      playersAwaitingReview: players.count ?? 0,
      pendingClaims: claims.count ?? 0,
      changeRequests: changes.count ?? 0,
    });
  }

  if (name === "get_social_metrics") {
    const { data } = await db
      .from("brand_metric_snapshots")
      .select("platform, captured_on, followers, views, posts, source")
      .gte("captured_on", new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10))
      .order("captured_on", { ascending: false });
    const rows = data ?? [];
    return JSON.stringify({
      latest: latestPerPlatform(rows),
      oldestInWindow: latestPerPlatform([...rows].reverse()),
      note: "Instagram and TikTok are entered by hand; check captured_on before trusting a number.",
    });
  }

  // search_players
  const query = String(input.query ?? "").trim().slice(0, 60);
  if (!query) return JSON.stringify({ players: [], note: "Empty query." });
  const { data } = await db
    .from("players")
    .select("id, first_name, last_name, level, is_claimed, is_verified, ranking_national")
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
    .limit(10);
  return JSON.stringify({ players: data ?? [] });
}
```

**Step 4: Run the tests**

```bash
npx vitest run src/lib/assistant/tools.test.ts
```

Expected: PASS (5 tests).

**Step 5: Commit**

```bash
git add src/lib/assistant/tools.ts src/lib/assistant/tools.test.ts
git commit -m "feat: read-only tool surface for the admin assistant"
```

---

### Task 11: The assistant route handler

**Files:**
- Create: `src/app/api/admin/assistant/route.ts`

**Step 1: Write the route**

Create `src/app/api/admin/assistant/route.ts`:

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { ASSISTANT_TOOLS, runTool } from "@/lib/assistant/tools";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SYSTEM = `You are the admin assistant for Talkin Flag, a flag-football media brand and athlete database run by Ambra and Tika.

You are talking to a site administrator inside the admin dashboard. Answer questions about the site and the show's social presence using your tools — never guess a number you could look up, and never state a figure you did not retrieve.

You can only read. You cannot approve players, publish posts, send emails, or change any data. When asked to do something like that, say plainly that you can't, and name the admin page where they can do it themselves (for example /admin/players for approvals, /admin/blog for posts).

Keep answers short and concrete — two or three sentences unless asked for more. Lead with the number or the answer, then the context. Instagram and TikTok figures are typed in by hand, so mention the reading date whenever it is more than a couple of weeks old.`;

const MAX_TURNS = 6;

export async function POST(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Assistant is not configured." }, { status: 503 });
  }

  const limited = await checkRateLimit(`assistant:${admin.id}`, 30, 60 * 60);
  if (!limited.success) {
    return NextResponse.json({ error: "Too many questions — try again shortly." }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as { messages?: unknown } | null;
  const incoming = Array.isArray(body?.messages) ? body!.messages : null;
  if (!incoming || incoming.length === 0) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }

  const client = new Anthropic();
  const messages = incoming.slice(-20) as Anthropic.MessageParam[];

  try {
    // Manual tool loop, bounded. Every tool is read-only (see lib/assistant/tools.ts).
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const response = await client.messages.create({
        model: "claude-opus-5",
        max_tokens: 16000,
        thinking: { type: "adaptive" },
        output_config: { effort: "low" },
        system: SYSTEM,
        tools: ASSISTANT_TOOLS,
        messages,
      });

      if (response.stop_reason === "refusal") {
        return NextResponse.json({ reply: "I can't help with that one." });
      }

      if (response.stop_reason !== "tool_use") {
        const text = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("\n")
          .trim();
        return NextResponse.json({ reply: text || "No answer." });
      }

      messages.push({ role: "assistant", content: response.content });

      const toolUses = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
      );
      const results: Anthropic.ToolResultBlockParam[] = [];
      for (const call of toolUses) {
        let content: string;
        try {
          content = await runTool(call.name, (call.input ?? {}) as Record<string, unknown>);
        } catch (e) {
          content = JSON.stringify({ error: e instanceof Error ? e.message : "tool failed" });
        }
        results.push({ type: "tool_result", tool_use_id: call.id, content });
      }
      messages.push({ role: "user", content: results });
    }

    return NextResponse.json({ reply: "That took too many steps — try a narrower question." });
  } catch (e) {
    console.error("[assistant]", e);
    return NextResponse.json({ error: "The assistant hit an error." }, { status: 500 });
  }
}
```

**Step 2: Confirm the rate-limit helper signature matches**

```bash
grep -n "export async function checkRateLimit" -A 8 src/lib/rate-limit.ts
```

If the exported name or argument order differs, adapt the call above to the real signature — do not change `rate-limit.ts`.

**Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: clean.

**Step 4: Commit**

```bash
git add src/app/api/admin/assistant/route.ts
git commit -m "feat: admin assistant API route (read-only tool loop)"
```

---

### Task 12: The assistant panel on `/admin`

**Files:**
- Create: `src/app/admin/AssistantPanel.tsx`
- Modify: `src/app/admin/page.tsx`

**Step 1: Write the client component**

Create `src/app/admin/AssistantPanel.tsx`:

```tsx
"use client";

import { useState } from "react";

type Turn = { role: "user" | "assistant"; text: string };

const SUGGESTIONS = [
  "How did we grow this week?",
  "What needs my attention?",
  "How is the show doing on YouTube?",
];

export default function AssistantPanel() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setBusy(true);
    setInput("");
    const next: Turn[] = [...turns, { role: "user", text: q }];
    setTurns(next);

    try {
      const res = await fetch("/api/admin/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: next.map((t) => ({ role: t.role, content: t.text })),
        }),
      });
      const data = await res.json();
      setTurns([
        ...next,
        { role: "assistant", text: data.reply ?? data.error ?? "Something went wrong." },
      ]);
    } catch {
      setTurns([...next, { role: "assistant", text: "Couldn't reach the assistant." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="border border-white/10 bg-[#0d0d0d] p-5 mb-10">
      <p className="text-white/30 text-[10px] font-display uppercase tracking-widest mb-3">
        Ask
      </p>

      {turns.length === 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => ask(s)}
              className="border border-white/20 text-white/50 text-xs px-3 py-1.5 hover:border-[#FDDD58]/50 hover:text-white transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {turns.length > 0 && (
        <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
          {turns.map((t, i) => (
            <p
              key={i}
              className={t.role === "user" ? "text-[#FDDD58] text-sm" : "text-white/80 text-sm whitespace-pre-wrap"}
            >
              {t.role === "user" ? `— ${t.text}` : t.text}
            </p>
          ))}
          {busy && <p className="text-white/30 text-sm">Thinking…</p>}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about the site or the show…"
          aria-label="Ask the admin assistant"
          className="flex-1 min-w-0 bg-black border border-white/20 text-white px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={busy}
          className="bg-[#FDDD58] text-black font-display text-xs uppercase tracking-widest px-4 py-2 disabled:opacity-40 hover:bg-[#FDDD58]/90 transition-colors"
        >
          Ask
        </button>
      </form>

      <p className="text-white/25 text-[10px] mt-3">
        Read-only — it can look things up, but it can&apos;t change anything.
      </p>
    </section>
  );
}
```

**Step 2: Mount it on `/admin`, only when configured**

In `src/app/admin/page.tsx`:

a. Add the import:

```typescript
import AssistantPanel from "./AssistantPanel";
```

b. In the JSX, directly after the "Today" brief section added in Task 7:

```tsx
      {process.env.ANTHROPIC_API_KEY && <AssistantPanel />}
```

Reading `process.env` in a server component is safe here and keeps the panel invisible until the key exists — no broken UI for an unconfigured deploy.

**Step 3: Typecheck and run the full suite**

```bash
npx tsc --noEmit && npm test
```

Expected: clean and green.

**Step 4: Commit**

```bash
git add src/app/admin/AssistantPanel.tsx src/app/admin/page.tsx
git commit -m "feat: admin assistant panel on the dashboard"
```

---

### Task 13: Phase 2 gate and merge

**Step 1: Full verification**

```bash
npx tsc --noEmit && npm test && npm run build
```

Expected: clean, green, and `/api/admin/assistant` present in the route list.

**Step 2: Live behavior check**

With `ANTHROPIC_API_KEY` set locally, on `/admin`:

- Ask "What needs my attention?" — the answer's numbers must match the pending chips on the same page
- Ask "Approve all pending players" — it must decline and point at `/admin/players`
- Ask "How is YouTube doing?" — the number must match the brand row
- Unset the key and reload — the panel disappears, the rest of the page is unaffected

**Step 3: Confirm the RLS/admin-gating guards still hold**

```bash
npx vitest run src/lib/supabase/usage-guard.test.ts src/lib/admin-gating.test.ts
```

Expected: PASS. These are the repo's structural guards — every new `/admin` and `/api/admin` surface must gate via `getAdminUser`, and the new `brand_*` tables must only be touched by the service-role client.

**Step 4: Merge and push**

```bash
git checkout main
git merge --ff-only admin-command-center
git push
```

Do **not** poll the Vercel deploy afterwards — check it later.

**Step 5: Write the owner note**

Create `docs/ambra-update-2026-08-07-command-center.md` covering: what changed on `/admin`, the 10-second daily habit of entering IG/TikTok numbers on `/admin/social` and why it matters (no service can backfill history), what the assistant can and can't do, and the two owner actions below.

---

## Owner Actions

1. **Set `ANTHROPIC_API_KEY` in Vercel** (Production + Preview) — the assistant panel stays hidden until then.
2. **Enter Instagram and TikTok numbers on `/admin/social`** the first time, then roughly weekly. Without a second reading there is no trend line.
3. **Decide (later, not now): is Instagram/TikTok OAuth worth the Meta/TikTok app-review process?** Revisit after a month of manual entry — by then you'll know whether the numbers are being looked at often enough to justify weeks of approval work.

---

## Phase 3 — Explicitly Deferred

Scoped so it can be picked up cleanly, **not to be built in this effort**:

| Item | Why deferred |
|---|---|
| Instagram Graph API / TikTok OAuth | Weeks of owner-blocked app review; manual entry produces identical data into the same table |
| Write-capable assistant (approve, publish, email) | Needs a confirmation UI + an audit log + a rollback story; changes the feature's security model entirely |
| Web analytics (page views, traffic sources, blog performance) | Needs an analytics provider decision first — Vercel Analytics is the cheapest path |
| Scheduled weekly digest email of the brief | Trivially built on `buildBrief()` once the brief has proven useful; the cron + Resend plumbing already exists |
| Trend sparklines on the dashboard | Wait until `brand_metric_snapshots` has 4+ weeks of real data |

When Phase 3 is picked up, `brand_metric_snapshots` is already the right shape — an OAuth sync writes rows with `source: 'api'` and every consumer keeps working untouched.
