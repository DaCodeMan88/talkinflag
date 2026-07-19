# Cohort Rankings + Players UI/UX Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Split player rankings into two independent cohorts — **High School (18U)** and **College / World** — so a national-team player can never appear ranked among high-schoolers, and rebuild the players/rankings browsing UX around that split.

**Architecture:** Add a pure `cohort` helper (level → `"hs"` | `"cw"`), make the recompute pipeline rank each cohort independently (writing per-cohort ordinals into the existing `ranking_national`/`ranking_position` columns — no players-table schema change), then make every surface that renders a rank say *which* cohort it belongs to ("HS #8" vs "CW #8"). The players page gets a cohort-first segmented control; the rankings table is only ever rendered for a single cohort, with a title that can no longer lie.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind, Supabase (project `wxeuybksowhncalrnttl`), Vitest.

**Context for the executor:**
- Root cause: `computeTfRank` in `src/lib/rankings/tfRank.ts` ranks ALL players as one pool. `PlayersFilter.tsx` then titles the unfiltered ranked table "High School Rankings" (lines 316–322). Ambra Marcucci (level `national`, global rank 8) therefore appeared 8th "among" HS players.
- Cohort definition (owner decision, 2026-07-18): `high_school` + `youth` → **HS (18U)**; `college` + `national` + `international` + anything else/null → **College / World**. Gender stays a filter, not a cohort.
- There is one uncommitted change in the working tree: `src/components/home/RankingsTeaser.tsx` (MaxPreps attribution removed — legal work, same session). Task 1's commit picks it up first as its own commit. **Do not push anything; owner said don't commit-and-ship without review — commit locally only.**
- Run tests with `npx vitest run <path>`. Typecheck with `npx tsc --noEmit`. Dev server config: `.claude/launch.json` (port 3000).
- DB migrations are applied live via the Supabase MCP `apply_migration` tool (no local stack). Keep the SQL file in `supabase/migrations/` as the record.

---

### Task 0: Commit the pending legal change (separate concern)

**Files:** `src/components/home/RankingsTeaser.tsx` (already modified, verified in browser earlier this session)

**Step 1: Commit it alone so plan work starts clean**

```bash
cd /Users/danielharris/Desktop/Flag/talkinflag
git add src/components/home/RankingsTeaser.tsx
git commit -m "chore: replace MaxPreps attribution on player poll with own-methodology label"
git status   # confirm working tree clean
```

---

### Task 1: Cohort helper (pure, tested)

**Files:**
- Create: `src/lib/rankings/cohort.ts`
- Test: `src/lib/rankings/cohort.test.ts`

**Step 1: Write the failing test**

```ts
// src/lib/rankings/cohort.test.ts
import { describe, it, expect } from "vitest";
import { cohortForLevel, COHORT_LABELS, cohortRankLabel } from "./cohort";

describe("cohortForLevel", () => {
  it("maps high_school and youth to hs", () => {
    expect(cohortForLevel("high_school")).toBe("hs");
    expect(cohortForLevel("youth")).toBe("hs");
  });
  it("maps college, national, international to cw", () => {
    expect(cohortForLevel("college")).toBe("cw");
    expect(cohortForLevel("national")).toBe("cw");
    expect(cohortForLevel("international")).toBe("cw");
  });
  it("maps unknown/null/undefined to cw (never leaks adults into 18U)", () => {
    expect(cohortForLevel(null)).toBe("cw");
    expect(cohortForLevel(undefined)).toBe("cw");
    expect(cohortForLevel("pro")).toBe("cw");
  });
});

describe("cohortRankLabel", () => {
  it("prefixes rank with cohort short code", () => {
    expect(cohortRankLabel("high_school", 8)).toBe("HS #8");
    expect(cohortRankLabel("national", 8)).toBe("CW #8");
  });
  it("returns null when no rank", () => {
    expect(cohortRankLabel("college", null)).toBeNull();
    expect(cohortRankLabel("college", undefined)).toBeNull();
  });
});

describe("COHORT_LABELS", () => {
  it("has display labels for both cohorts", () => {
    expect(COHORT_LABELS.hs).toBe("High School (18U)");
    expect(COHORT_LABELS.cw).toBe("College / World");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/rankings/cohort.test.ts`
Expected: FAIL — cannot resolve `./cohort`

**Step 3: Write the implementation**

```ts
// src/lib/rankings/cohort.ts
// Ranking cohorts: HS (18U) players are never ranked against college/world players.
// Owner decision 2026-07-18: high_school+youth = "hs"; everything else = "cw".

export type Cohort = "hs" | "cw";

export const COHORT_LABELS: Record<Cohort, string> = {
  hs: "High School (18U)",
  cw: "College / World",
};

export const COHORT_SHORT: Record<Cohort, string> = {
  hs: "HS",
  cw: "CW",
};

export function cohortForLevel(level: string | null | undefined): Cohort {
  return level === "high_school" || level === "youth" ? "hs" : "cw";
}

export function cohortRankLabel(
  level: string | null | undefined,
  rank: number | null | undefined,
): string | null {
  if (rank == null) return null;
  return `${COHORT_SHORT[cohortForLevel(level)]} #${rank}`;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/rankings/cohort.test.ts`
Expected: PASS (7 tests)

**Step 5: Commit**

```bash
git add src/lib/rankings/cohort.ts src/lib/rankings/cohort.test.ts
git commit -m "feat: cohort helper — HS (18U) vs College/World ranking split"
```

---

### Task 2: Per-cohort ranking computation

**Files:**
- Modify: `src/lib/rankings/tfRank.ts` (add `computeCohortRanks` after `computeTfRank`, ~line 249)
- Test: `src/lib/rankings/tfRank.test.ts` (append a new describe block)

`computeTfRank` stays untouched (its tests keep passing); the new function partitions then delegates.

**Step 1: Write the failing test** — append to `src/lib/rankings/tfRank.test.ts`:

```ts
import { computeCohortRanks } from "./tfRank"; // add to existing imports

describe("computeCohortRanks", () => {
  // Minimal players: stats drive score; level drives cohort.
  const mk = (id: string, level: string, catches: number) => ({
    id,
    level,
    position: "WR",
    is_verified: true,
    is_claimed: true,
    stats: { catches },
  });

  it("ranks each cohort independently from 1", () => {
    const players = [
      mk("hs-best", "high_school", 100),
      mk("hs-second", "youth", 50),
      mk("cw-best", "national", 90),
      mk("cw-second", "college", 40),
    ];
    const ranked = computeCohortRanks(players, {});
    const byId = Object.fromEntries(ranked.map((r) => [r.playerId, r]));
    expect(byId["hs-best"].ranking_national).toBe(1);
    expect(byId["hs-second"].ranking_national).toBe(2);
    expect(byId["cw-best"].ranking_national).toBe(1);
    expect(byId["cw-second"].ranking_national).toBe(2);
  });

  it("tags every result with its cohort", () => {
    const ranked = computeCohortRanks(
      [mk("a", "high_school", 10), mk("b", "national", 10)],
      {},
    );
    const byId = Object.fromEntries(ranked.map((r) => [r.playerId, r]));
    expect(byId["a"].cohort).toBe("hs");
    expect(byId["b"].cohort).toBe("cw");
  });

  it("REGRESSION (Ambra bug): a national player never outranks HS players inside the hs cohort", () => {
    // A high-scoring national player must not consume an hs cohort rank.
    const players = [
      mk("national-star", "national", 999),
      mk("hs-kid-1", "high_school", 10),
      mk("hs-kid-2", "high_school", 5),
    ];
    const ranked = computeCohortRanks(players, {});
    const hs = ranked.filter((r) => r.cohort === "hs");
    expect(hs.map((r) => r.playerId).sort()).toEqual(["hs-kid-1", "hs-kid-2"]);
    expect(hs.find((r) => r.playerId === "hs-kid-1")!.ranking_national).toBe(1);
  });
});
```

**Step 2: Run to verify failure**

Run: `npx vitest run src/lib/rankings/tfRank.test.ts`
Expected: FAIL — `computeCohortRanks` is not exported. (All pre-existing tests must still PASS.)

**Step 3: Implement** — append to `src/lib/rankings/tfRank.ts`:

```ts
import { cohortForLevel, type Cohort } from "./cohort"; // top of file

export type CohortRankedPlayer = RankedPlayer & { cohort: Cohort };

// Rank each cohort (HS 18U vs College/World) as an independent pool.
export function computeCohortRanks(
  players: Array<Parameters<typeof computeTfRank>[0][number] & { level?: string | null }>,
  weights: WeightMap,
): CohortRankedPlayer[] {
  const pools: Record<Cohort, typeof players> = { hs: [], cw: [] };
  for (const p of players) pools[cohortForLevel(p.level)].push(p);

  return (Object.keys(pools) as Cohort[]).flatMap((cohort) =>
    computeTfRank(pools[cohort], weights).map((r) => ({ ...r, cohort })),
  );
}
```

**Step 4: Run tests**

Run: `npx vitest run src/lib/rankings/tfRank.test.ts src/lib/rankings/cohort.test.ts`
Expected: ALL PASS (old + new)

**Step 5: Commit**

```bash
git add src/lib/rankings/tfRank.ts src/lib/rankings/tfRank.test.ts
git commit -m "feat: computeCohortRanks — independent HS(18U) and College/World rank pools"
```

---

### Task 3: Recompute pipeline writes per-cohort ranks + cohort-tagged snapshots

**Files:**
- Modify: `src/lib/rankings/recompute.ts` (function `scoreAndWriteRanks`, lines 116–165)
- Create: `supabase/migrations/016_ranking_snapshot_cohort.sql`

**Step 1: Write the migration file**

```sql
-- 016_ranking_snapshot_cohort.sql
-- Rankings are now computed per cohort (hs = 18U, cw = college/world).
alter table ranking_snapshots add column if not exists cohort text;
```

**Step 2: Apply it live** via Supabase MCP `apply_migration` (project `wxeuybksowhncalrnttl`, name `016_ranking_snapshot_cohort`). Verify with `list_migrations`.

**Step 3: Modify `scoreAndWriteRanks`**

- Line 118: add `level` to the select →
  `db.from("players").select("id, position, level, is_verified, is_claimed, stats, league_key")`
- Line 16 import: `import { computeCohortRanks } from "./tfRank";` (replace the `computeTfRank` import — recompute no longer calls it directly)
- Line 135: `const ranked = computeCohortRanks(playersWithDifficulty, weightMap);`
- Snapshot block (lines 149–162): snapshot **top 100 per cohort**, tagging cohort:

```ts
  // Snapshot (top 100 per cohort by score)
  const snapshotRows = (["hs", "cw"] as const).flatMap((cohort) =>
    ranked
      .filter((r) => r.cohort === cohort)
      .sort((a, b) => a.ranking_national - b.ranking_national)
      .slice(0, 100)
      .map((r) => ({
        player_id: r.playerId,
        cohort: r.cohort,
        ranking_national: r.ranking_national,
        ranking_position: r.ranking_position,
        tf_score: r.score,
        position_bucket: r.positionBucket,
        dim_scores: r.dimScores,
        verification_factor: r.verificationFactor,
        snapshotted_at: new Date().toISOString(),
      })),
  );
  if (snapshotRows.length) {
    await db.from("ranking_snapshots").insert(snapshotRows);
  }
```

The write-back loop (lines 138–147) needs no change — it already writes `ranking_national`/`ranking_position` per player.

**Step 4: Verify**

Run: `npx tsc --noEmit` → clean. `npx vitest run` → all pass.

**Step 5: Commit**

```bash
git add src/lib/rankings/recompute.ts supabase/migrations/016_ranking_snapshot_cohort.sql
git commit -m "feat: recompute ranks per cohort; cohort-tagged snapshots"
```

---

### Task 4: RankingsTable becomes cohort-aware (title can't lie)

**Files:**
- Modify: `src/components/players/RankingsTable.tsx`

**Step 1: Change the props contract.** Replace free-text `title` with structured props, and add an 18U chip:

```tsx
import Link from "next/link";
import { Player } from "@/types/player";
import { COHORT_LABELS, cohortForLevel, type Cohort } from "@/lib/rankings/cohort";

export function RankingsTable({
  players,
  cohort,
  genderLabel,
}: {
  players: Player[];
  cohort: Cohort;
  genderLabel?: string; // "Women's" | "Men's" | undefined
}) {
  // Defensive: only rows that belong to this cohort AND have a rank.
  const ranked = players.filter(
    (p) => p.ranking_national != null && cohortForLevel(p.level) === cohort,
  );
  if (ranked.length === 0) return null;
  const sorted = [...ranked].sort(
    (a, b) => (a.ranking_national ?? 0) - (b.ranking_national ?? 0),
  );

  return (
    <div className="overflow-x-auto mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-sm uppercase tracking-widest text-brand-yellow">
          {genderLabel ? `${genderLabel} ` : ""}{COHORT_LABELS[cohort]} Rankings
        </h2>
        <span className="text-brand-white/30 text-xs">{sorted.length} ranked players</span>
      </div>
      {/* table unchanged below, but map over `sorted` */}
      ...
    </div>
  );
}
```

Keep the existing `<table>` markup (lines 19–61) intact; just map `sorted` instead of `ranked`.

**Step 2: Fix the compile break this causes in `PlayersFilter.tsx`** — temporary shim so this commit stands alone: replace the `<RankingsTable ... title={...}>` call (lines 313–324) with a cohort-guarded version (final UX lands in Task 5):

```tsx
{level !== "" && rankedFiltered.length > 0 && (
  <RankingsTable
    players={rankedFiltered}
    cohort={level === "high_school" ? "hs" : "cw"}
    genderLabel={gender === "female" ? "Women's" : gender === "male" ? "Men's" : undefined}
  />
)}
```

Note: with `level === ""` (All) **no mixed table renders at all** — that alone kills the reported bug at the UI layer.

**Step 3: Verify**

Run: `npx tsc --noEmit` → clean. `npx vitest run` → pass.

**Step 4: Commit**

```bash
git add src/components/players/RankingsTable.tsx src/components/players/PlayersFilter.tsx
git commit -m "fix: rankings table is cohort-scoped; no mixed-cohort table on All view"
```

---

### Task 5: Players page UX overhaul — cohort-first browsing

**Files:**
- Modify: `src/components/players/PlayersFilter.tsx` (this is the big one)

**Design (the 10x):**
1. **Primary segmented control** replaces the level pills, promoted to the top (above search): `All Players · High School (18U) · College · World`, each with a live count badge. HS is visually separated from College/World by a thin divider + the College and World tabs sit inside a subtle shared bracket labeled "College / World rankings pool" (tooltip/aria-description: "College and World players are ranked together").
2. **"All Players" view** shows the card grid plus, above it, two compact side-by-side leaderboard cards — "HS (18U) Top 5" and "College / World Top 5" — each linking to its full filtered view. Mixed full table never renders.
3. **Single-cohort views** (`high_school`, or `college`/`world`) render the full `RankingsTable` for that cohort. Note: `college` and `world` filters narrow the *grid* by level, but the table shown for either is the shared **College / World** cohort table filtered to those levels — the rank numbers stay the cohort ordinals, so "CW #8" reads identically in both.
4. **Sticky filter bar** (`sticky top-16 z-20 bg-brand-black/95 backdrop-blur border-b border-brand-white/10`) so filters stay reachable while scrolling 300 cards.
5. **Active-filter chips row**: every active filter renders a dismissible chip (`Women's ×`, `QB ×`, `Italy ×`); "Clear all" appears when ≥2. Replaces the buried text-only clear link.
6. **Position pills and gender toggle stay** as-is functionally, restyled into one row with the chips.

**Step 1: Implement.** Key code (structure — keep existing handlers/state; `level` state values unchanged so URL params like `?level=high_school` keep working):

```tsx
import { COHORT_LABELS, cohortForLevel } from "@/lib/rankings/cohort";

// Above `filtered` memo — counts for the segmented control:
const counts = useMemo(() => {
  const hs = players.filter((p) => cohortForLevel(p.level) === "hs").length;
  const college = players.filter((p) => p.level === "college").length;
  const world = players.filter((p) => p.level === "national" || p.level === "international").length;
  return { all: players.length, hs, college, world };
}, [players]);

// Cohort top-5 lists for the All view:
const top5 = useMemo(() => {
  const ranked = players.filter((p) => p.ranking_national != null);
  const take = (pred: (p: Player) => boolean) =>
    ranked.filter(pred).sort((a, b) => a.ranking_national! - b.ranking_national!).slice(0, 5);
  return {
    hs: take((p) => cohortForLevel(p.level) === "hs"),
    cw: take((p) => cohortForLevel(p.level) === "cw"),
  };
}, [players]);
```

Segmented control (replaces the LEVELS pills block, lines 193–208):

```tsx
{/* Cohort segmented control */}
<div className="flex flex-wrap items-stretch gap-1.5" role="group" aria-label="Browse by level">
  <SegBtn active={level === ""} onClick={() => setLevel("")} label="All Players" count={counts.all} />
  <SegBtn active={level === "high_school"} onClick={() => setLevel(level === "high_school" ? "" : "high_school")} label="High School (18U)" count={counts.hs} />
  <div className="w-px self-stretch bg-brand-white/15 mx-1" aria-hidden="true" />
  <div
    className="flex gap-1.5 border border-brand-white/10 p-1 -m-1"
    role="group"
    aria-label="College and World players are ranked together in one pool"
    title="College and World players are ranked together in one pool"
  >
    <SegBtn active={level === "college"} onClick={() => setLevel(level === "college" ? "" : "college")} label="College" count={counts.college} />
    <SegBtn active={level === "world"} onClick={() => setLevel(level === "world" ? "" : "world")} label="World" count={counts.world} />
  </div>
</div>
```

`SegBtn` (small local component in the same file):

```tsx
function SegBtn({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`font-display text-xs uppercase tracking-widest px-3 py-1.5 transition-colors flex items-center gap-1.5 ${
        active ? "bg-brand-yellow text-brand-black"
               : "border border-brand-white/20 text-brand-white/60 hover:border-brand-white/40 hover:text-brand-white"
      }`}
    >
      {label}
      <span className={`text-[10px] tabular-nums ${active ? "text-brand-black/60" : "text-brand-white/30"}`}>{count}</span>
    </button>
  );
}
```

All-view dual leaderboards (replaces the Task-4 shim's absent-table state; render where the RankingsTable block sits):

```tsx
{level === "" ? (
  (top5.hs.length > 0 || top5.cw.length > 0) && (
    <div className="grid sm:grid-cols-2 gap-4 mb-10">
      {([["hs", "high_school"], ["cw", "college"]] as const).map(([cohort, linkLevel]) => (
        top5[cohort].length > 0 && (
          <div key={cohort} className="border border-brand-white/10 bg-[#0d0d0d] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xs uppercase tracking-widest text-brand-yellow">
                {COHORT_LABELS[cohort]} Top 5
              </h3>
              <button onClick={() => setLevel(linkLevel)} className="text-brand-white/40 hover:text-brand-yellow text-xs font-display uppercase tracking-widest transition-colors">
                Full rankings →
              </button>
            </div>
            <ol className="space-y-2">
              {top5[cohort].map((p) => (
                <li key={p.id} className="flex items-center gap-3">
                  <span className="text-brand-yellow font-display text-sm w-6 text-right tabular-nums">{p.ranking_national}</span>
                  <Link href={`/players/${p.id}`} className="text-brand-white text-sm hover:text-brand-yellow transition-colors truncate">
                    {p.first_name} {p.last_name}
                  </Link>
                  {p.position && <span className="text-brand-white/30 text-xs uppercase font-display ml-auto shrink-0">{p.position}</span>}
                </li>
              ))}
            </ol>
          </div>
        )
      ))}
    </div>
  )
) : (
  rankedFiltered.length > 0 && (
    <RankingsTable
      players={rankedFiltered}
      cohort={level === "high_school" ? "hs" : "cw"}
      genderLabel={gender === "female" ? "Women's" : gender === "male" ? "Men's" : undefined}
    />
  )
)}
```

Sticky wrapper: wrap the existing "Search + filter bar" div (line 114) in
`<div className="sticky top-16 z-20 bg-brand-black/95 backdrop-blur-sm -mx-4 px-4 pt-2 pb-3 border-b border-brand-white/10 mb-8">` and drop its old `mb-8`.

Active-filter chips (insert directly under the sticky bar, replacing the current results-summary block's clear link; keep the count text):

```tsx
{hasAnyFilter && (
  <div className="flex flex-wrap items-center gap-2 mb-6">
    {gender && <Chip label={gender === "female" ? "Women's / Girls'" : "Men's / Boys'"} onClear={() => setGender("")} />}
    {level && <Chip label={level === "high_school" ? "High School (18U)" : level === "world" ? "World" : "College"} onClear={() => setLevel("")} />}
    {position && <Chip label={position} onClear={() => setPosition("")} />}
    {country && <Chip label={country} onClear={() => setCountry("")} />}
    {gradYear && <Chip label={`Class of ${gradYear}`} onClear={() => setGradYear("")} />}
    {query.trim() && <Chip label={`"${query.trim()}"`} onClear={() => setQuery("")} />}
    <button onClick={clearAll} className="text-brand-white/40 hover:text-brand-yellow font-display text-xs uppercase tracking-widest transition-colors ml-1">
      × Clear all
    </button>
  </div>
)}
```

```tsx
function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-brand-yellow/10 border border-brand-yellow/30 text-brand-yellow text-xs font-display uppercase tracking-widest px-2.5 py-1">
      {label}
      <button onClick={onClear} aria-label={`Remove ${label} filter`} className="hover:text-brand-white transition-colors">
        <X size={11} />
      </button>
    </span>
  );
}
```

**Step 2: Verify** — `npx tsc --noEmit` clean; `npx vitest run` pass.

**Step 3: Browser check** (dev server, `/players`):
- All view: segmented control with counts; two Top-5 leaderboards; **no** full mixed table; Ambra absent from the HS Top 5 card (she'll be in College/World Top 5 once Task 8's recompute runs — until then DB still holds global ranks, so leaderboard *numbers* may look stale; structure is what's being verified here).
- Click "High School (18U)": table titled "High School (18U) Rankings"; every row's Level column reads High School.
- Click "College" then "World": table titled "College / World Rankings" in both.
- Chips appear/dismiss correctly; sticky bar holds while scrolling; 375px viewport: control wraps to two rows, no horizontal scroll.

**Step 4: Commit**

```bash
git add src/components/players/PlayersFilter.tsx
git commit -m "feat: cohort-first players browsing — segmented control, dual top-5, sticky filters, filter chips"
```

---

### Task 6: Rank badges say their cohort everywhere

**Files:**
- Modify: `src/components/players/PlayerCard.tsx` (lines 33–37)
- Modify: `src/app/rankings/page.tsx` (split National Rankings table into two cohort tables)
- Modify: `src/components/home/PlayersSpotlight.tsx`, `src/components/home/FeaturedAthleteSection.tsx`, `src/app/athletes/featured/page.tsx`, `src/app/players/[id]/page.tsx`, `src/app/players/[id]/embed/page.tsx`, `src/app/players/[id]/card/route.tsx`, `src/app/players/[id]/opengraph-image.tsx`, `src/app/players/compare/page.tsx`, `src/components/player/SimilarPlayers.tsx`, `src/components/rankings/RankingsHub.tsx` — wherever a bare `#{ranking_national}` renders

**Step 1: PlayerCard** — replace lines 33–37:

```tsx
import { cohortRankLabel } from "@/lib/rankings/cohort"; // top of file

{cohortRankLabel(player.level, player.ranking_national) && (
  <span className="text-brand-yellow font-display text-xs uppercase tracking-widest">
    {cohortRankLabel(player.level, player.ranking_national)}
  </span>
)}
```

**Step 2: `/rankings` page** — in `src/app/rankings/page.tsx`, replace the single "National Rankings" table (lines 135–219) with two stacked sections. Partition server-side:

```tsx
import { cohortForLevel, COHORT_LABELS } from "@/lib/rankings/cohort";

const cohorts = (["hs", "cw"] as const).map((c) => ({
  cohort: c,
  label: COHORT_LABELS[c],
  players: ranked
    .filter((p) => cohortForLevel(p.level) === c)
    .sort((a, b) => (a.ranking_national ?? 0) - (b.ranking_national ?? 0)),
}));
```

Render the existing table markup once per cohort (`<h2>{label} Rankings</h2>`, count per cohort, same columns). Keep the empty-state block for when *both* are empty. Drop the now-unused single-table heading "National Rankings".

**Step 3: Sweep the remaining files.** For each file listed, `grep -n "ranking_national"` and:
- Where it renders a visible "#N" near a player name → use `cohortRankLabel(level, rank)` (import from `@/lib/rankings/cohort`). If `level` isn't in that component's select/props, add it to the query/prop — every one of these reads from `players` which has `level`.
- Where it's only used for ordering/filtering (e.g. `SimilarPlayers`, `api/players/search`) → leave logic, no display change needed.
- `card/route.tsx` + `opengraph-image.tsx` are satori/edge — plain string interpolation of `cohortRankLabel(...)` is safe (no JSX constraint issues).
- `RankingsHub.tsx`: its player usages are national-roster lists (all `cw`) — label accordingly if a rank renders; otherwise no-op.

**Step 4: Verify** — `npx tsc --noEmit`; `npx vitest run`; then browser-check one instance of each surface type: a player card on `/players`, a profile page, `/rankings`.

**Step 5: Commit**

```bash
git add -A src/
git commit -m "feat: cohort-labeled rank badges across all rank surfaces; /rankings split into HS and College/World tables"
```

---

### Task 7: Homepage teaser sanity pass

**Files:**
- Modify: `src/components/home/RankingsTeaser.tsx`

It already filters `level=high_school`, `gender=female`, ordered by `ranking_national` — after the recompute those are true HS-cohort ordinals, so ranks 1–10 will finally be contiguous. Two touches:

1. Heading eyebrow (line ~34): `Girls High School` → `Girls High School (18U)`.
2. Rank cell already prints `player.ranking_national` — correct as-is post-recompute; no cohort prefix needed since the section is single-cohort and labeled.

Verify in browser (homepage section), commit:

```bash
git add src/components/home/RankingsTeaser.tsx
git commit -m "feat: label homepage HS rankings teaser as 18U"
```

---

### Task 8: Recompute live ranks + end-to-end verification

**Step 1: Run the recompute** so the DB's `ranking_national` values become per-cohort. Either:
- Admin panel: `/admin/rankings` → Recompute button (sign in as an `ADMIN_EMAILS` account), or
- If a cron/API route with `CRON_SECRET` exists (check `src/app/api` for the recompute route), curl it with the secret from Vercel env.

This runs against **production Supabase** (there is no staging DB). It rewrites `ranking_national` for all 374 players. That is the intended outcome, but do it as the LAST step, after all UI code above is committed, so no deployed/local UI ever shows per-cohort numbers under mixed-cohort assumptions or vice versa.

**Step 2: Verify the fix that started all this**

```sql
-- via Supabase MCP execute_sql:
select first_name, last_name, level, ranking_national
from players
where is_approved and ranking_national is not null
order by ranking_national asc limit 15;
```

Expected: HS players and college/world players each count 1,2,3… independently; Ambra (level `national`) holds a `cw` ordinal and appears NOWHERE in HS-scoped UI.

**Step 3: Browser E2E** (dev server against live DB):
- `/players` All view → HS Top 5 contains only HS names; CW Top 5 contains Ambra et al.
- `/players?level=high_school` → table starts at #1, all HS.
- `/rankings` → two tables, each starting at #1.
- Homepage teaser → Girls HS (18U) Top 10, ranks 1–10 contiguous.
- 375px viewport pass on `/players`.

**Step 4: Final commit + snapshot state**

```bash
npx tsc --noEmit && npx vitest run && npm run build
git status   # everything committed
```

**DO NOT PUSH.** Owner reviews first (their explicit instruction this session). Present the verification evidence and wait.

---

## Out of scope (noted, deliberately skipped — YAGNI)

- `api/players/search` typeahead still orders by `ranking_national` globally, which post-change interleaves cohort ordinals (two "#1"s). Harmless for a name-search dropdown; revisit only if it confuses anyone.
- `ranking_snapshots` historical rows have `cohort = null` — they're pre-split history; leave them.
- No `cohort` column on `players` — derivable from `level`; adding one would create a second source of truth.
- Gender-split ranking pools (girls vs boys ranked separately) — owner hasn't asked; filters cover it.
