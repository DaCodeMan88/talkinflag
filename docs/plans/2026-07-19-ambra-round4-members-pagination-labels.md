# Ambra Round 4 — Members Admin, Rankings Pagination, Cohort Labels Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close Ambra's 2026-07-19 bug report: make the two "phantom" 6/27 members manageable (they are REAL users — do NOT delete), clarify why Martika appears under Italy in World ranks, paginate the player/rankings lists in batches of 25 (mobile too), and label the College/World cohort "(18+)" to mirror "(18U)".

**Architecture:** Pure pagination helper + client-side pagination in the existing client components (no server round-trips — full approved list is only ~412 rows). Admin member deletion via a service-role server action gated by `getAdminUser`. Label change flows from the single source of truth `COHORT_LABELS`.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind, Supabase (service-role admin client), Vitest.

---

## Investigation findings (already verified against live DB — do not re-litigate)

1. **"Phantom profiles" are REAL signups, not test data. DO NOT DELETE THEM.**
   - `tristancornet47@gmail.com` (Tristan Cornet, auth user `e0152d69-…`, created 2026-06-27) — has **no `players` row at all**. He signed up but never created/claimed a player profile. That's why Ambra can't approve/delete/see him anywhere except `/admin/members`: there is literally nothing to approve, and the members page has no actions.
   - `aouellette1013@gmail.com` (Aleena Ouellette, auth user `0258af89-…`, created 2026-06-25) — HAS a players row (`b08b341a-…`, HS, Canada, DB, `is_approved=true`, HS rank #20) but `claimed_by IS NULL` — her player row was never linked to her account. `/admin/members` only joins players `WHERE claimed_by IS NOT NULL`, so her row shows "no player" there; and she's already approved, so she never appears in the Pending Review tab. Nothing is broken about her public profile.
   - Deliverable: give Ambra the missing admin powers (delete a member account; see "no player profile" state clearly) and tell her these are real early users.

2. **Martika in World ranks = expected roster display, unclear labeling.** `/teams` World tab ranks **teams** (IFAF, Italy #8). Expanding Italy lists the Supabase national roster ([TeamsHub.tsx:431-453](src/components/rankings/TeamsHub.tsx)) — Martika is on Italy's 2024 roster, so she appears. She is NOT "ranked 8th" (she's CW #1). Fix = label the roster explicitly and show each player's real cohort rank chip.

3. **Truncated lists.** `/players` fetches `.limit(300)` of 412 approved players ([players/page.tsx:28](src/app/players/page.tsx)) — the ~112 highest-numbered CW ranks silently never render, and the client grid renders everything at once with no paging. `/rankings` fetches `.limit(100)` ([rankings/page.tsx:37](src/app/rankings/page.tsx)) so each cohort table is cut off. DB truth: 43 HS-cohort players (42 HS + 1 youth), 369 CW, all approved+ranked.

4. **Label:** `COHORT_LABELS.cw = "College / World"` in [cohort.ts:8](src/lib/rankings/cohort.ts) — needs "(18+)". Two hardcoded copies exist: [PlayersFilter.tsx:320](src/components/players/PlayersFilter.tsx) chip and [players/[id]/page.tsx:274](src/app/players/[id]/page.tsx) "College/World Rank" stat label.

**Branch:** create `ambra-round4` off `main` before Task 1.

---

### Task 1: Cohort label "(18+)"

**Files:**
- Modify: `src/lib/rankings/cohort.ts:8`
- Modify: `src/lib/rankings/cohort.test.ts`
- Modify: `src/components/players/PlayersFilter.tsx:320`
- Modify: `src/app/players/[id]/page.tsx:274`

**Step 1: Update the test first**

In `cohort.test.ts`, find the assertion on `COHORT_LABELS.cw` (or add one):

```ts
expect(COHORT_LABELS.cw).toBe("College / World (18+)");
expect(COHORT_LABELS.hs).toBe("High School (18U)");
```

**Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/rankings/cohort.test.ts`
Expected: FAIL — received "College / World".

**Step 3: Implement**

In `cohort.ts`:
```ts
export const COHORT_LABELS: Record<Cohort, string> = {
  hs: "High School (18U)",
  cw: "College / World (18+)",
};
```

In `PlayersFilter.tsx:320` change the chip literal `"College / World"` → `COHORT_LABELS.cw` (it already imports `COHORT_LABELS`).

In `players/[id]/page.tsx:274` change `"College/World Rank"` → `"College/World (18+) Rank"`.

**Step 4: Run tests**

Run: `npx vitest run src/lib/rankings/cohort.test.ts` → PASS, then `npx tsc --noEmit` → clean.

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: label College/World cohort as (18+) to mirror HS (18U)"
```

---

### Task 2: Pagination helper (pure, tested)

**Files:**
- Create: `src/lib/pagination.ts`
- Create: `src/lib/pagination.test.ts`

**Step 1: Write failing tests**

```ts
// src/lib/pagination.test.ts
import { describe, it, expect } from "vitest";
import { paginate, pageCount, pageRangeLabel } from "./pagination";

describe("paginate", () => {
  const items = Array.from({ length: 81 }, (_, i) => i + 1);
  it("returns first batch of 25", () => {
    expect(paginate(items, 1, 25)).toEqual(items.slice(0, 25));
  });
  it("returns partial last page", () => {
    expect(paginate(items, 4, 25)).toEqual([76, 77, 78, 79, 80, 81]);
  });
  it("clamps out-of-range page to last page", () => {
    expect(paginate(items, 99, 25)).toEqual([76, 77, 78, 79, 80, 81]);
    expect(paginate(items, 0, 25)).toEqual(items.slice(0, 25));
  });
  it("handles empty list", () => {
    expect(paginate([], 1, 25)).toEqual([]);
  });
});

describe("pageCount", () => {
  it("computes ceil", () => {
    expect(pageCount(81, 25)).toBe(4);
    expect(pageCount(25, 25)).toBe(1);
    expect(pageCount(0, 25)).toBe(1);
  });
});

describe("pageRangeLabel", () => {
  it("labels 26–50 style ranges", () => {
    expect(pageRangeLabel(2, 25, 81)).toBe("26–50");
    expect(pageRangeLabel(4, 25, 81)).toBe("76–81");
    expect(pageRangeLabel(1, 25, 10)).toBe("1–10");
  });
});
```

**Step 2:** Run: `npx vitest run src/lib/pagination.test.ts` → FAIL (module not found).

**Step 3: Implement**

```ts
// src/lib/pagination.ts
// Client-side pagination for ranking/player lists (batches of 25 per owner request).

export const PAGE_SIZE = 25;

export function pageCount(total: number, perPage: number = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / perPage));
}

export function paginate<T>(items: T[], page: number, perPage: number = PAGE_SIZE): T[] {
  const last = pageCount(items.length, perPage);
  const p = Math.min(Math.max(1, page), last);
  return items.slice((p - 1) * perPage, p * perPage);
}

export function pageRangeLabel(page: number, perPage: number, total: number): string {
  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);
  return `${start}–${end}`;
}
```

**Step 4:** Run: `npx vitest run src/lib/pagination.test.ts` → PASS.

**Step 5: Commit**

```bash
git add src/lib/pagination.ts src/lib/pagination.test.ts
git commit -m "feat: pure pagination helpers (25/page) with tests"
```

---

### Task 3: Shared Paginator UI component

**Files:**
- Create: `src/components/ui/Paginator.tsx`

Brand style: yellow `#FDDD58` active, `font-display uppercase tracking-widest`, works at 375px (wrap + horizontal scroll not needed at ≤ ~17 pages; use compact number buttons).

**Step 1: Implement** (client component; no test — pure presentational, covered by E2E check in Task 7)

```tsx
"use client";
import { pageCount, pageRangeLabel } from "@/lib/pagination";

interface PaginatorProps {
  total: number;
  page: number;
  perPage: number;
  onPageChange: (page: number) => void;
  /** e.g. "players" — used in the aria-label + range summary */
  itemNoun?: string;
}

export function Paginator({ total, page, perPage, onPageChange, itemNoun = "players" }: PaginatorProps) {
  const pages = pageCount(total, perPage);
  if (pages <= 1) return null;
  return (
    <nav aria-label={`Pagination for ${itemNoun}`} className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="font-display text-xs uppercase tracking-widest px-3 py-1.5 border border-brand-white/20 text-brand-white/60 hover:border-brand-white/40 hover:text-brand-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
      >
        ← Prev
      </button>
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          aria-current={p === page ? "page" : undefined}
          title={pageRangeLabel(p, perPage, total)}
          className={`font-display text-xs uppercase tracking-widest px-3 py-1.5 transition-colors tabular-nums ${
            p === page
              ? "bg-brand-yellow text-brand-black"
              : "border border-brand-white/20 text-brand-white/60 hover:border-brand-white/40 hover:text-brand-white"
          }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pages}
        className="font-display text-xs uppercase tracking-widest px-3 py-1.5 border border-brand-white/20 text-brand-white/60 hover:border-brand-white/40 hover:text-brand-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
      >
        Next →
      </button>
      <span className="basis-full text-center text-brand-white/30 text-[11px] mt-1">
        Showing {pageRangeLabel(page, perPage, total)} of {total}
      </span>
    </nav>
  );
}
```

Note: 412 players / 25 ≈ 17 buttons on the All view — acceptable wrapped on mobile, but if it looks cramped at 375px during Task 7 verification, switch the number list to a windowed set (1 … p-1 p p+1 … last). Do NOT preemptively build the windowing.

**Step 2:** `npx tsc --noEmit` → clean.

**Step 3: Commit**

```bash
git add src/components/ui/Paginator.tsx
git commit -m "feat: brand-styled Paginator component"
```

---

### Task 4: Wire pagination into /players (grid + rankings table) and lift the 300-row cap

**Files:**
- Modify: `src/app/players/page.tsx:28` — `.limit(300)` → `.limit(1000)` (412 rows today; 1000 is PostgREST-safe headroom)
- Modify: `src/components/players/PlayersFilter.tsx`
- Modify: `src/components/players/RankingsTable.tsx`

**Step 1: PlayersFilter — paginate the card grid**

- Add `import { Paginator } from "@/components/ui/Paginator";` and `import { paginate, PAGE_SIZE } from "@/lib/pagination";`
- Add state: `const [page, setPage] = useState(1);`
- Reset to page 1 whenever any filter changes — simplest correct approach, add to every existing setter call site via a wrapper:

```ts
function withPageReset<T>(setter: (v: T) => void) {
  return (v: T) => { setPage(1); setter(v); };
}
```

  Then in the JSX replace `setQuery`/`setPosition`/`setLevel`/`setCountry`/`setGender`/`setGradYear` handlers with wrapped versions (define once near the top: `const setQueryP = withPageReset(setQuery);` etc., and use those everywhere including `clearAll`).
- Replace the grid map (`{filtered.map(...)}` around line 410) with:

```tsx
{paginate(filtered, page).map((player) => (
  <PlayerCard key={player.id} player={player} />
))}
```

- After the grid `</div>`, render:

```tsx
<Paginator total={filtered.length} page={page} perPage={PAGE_SIZE} onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "instant" }); }} />
```

(`behavior: "instant"` required — globals.css sets `scroll-behavior: smooth`.)

**Step 2: RankingsTable — paginate rows internally**

`RankingsTable.tsx` (76 lines) receives the full ranked cohort list. Make it own its paging so both `/players` and `/rankings` get it for free:
- Add `"use client"` if not present; add `useState` page + `paginate` + `<Paginator itemNoun="ranked players" ...>` after the table.
- Rank numbers come from `p.ranking_national`, not row index — verify no `index + 1` rank rendering exists; if it does, replace with `ranking_national`.
- Reset page to 1 when the `players` prop identity changes: `useEffect(() => setPage(1), [players]);`

**Step 3: players/page.tsx** — change `.limit(300)` to `.limit(1000)`.

**Step 4: Verify**

Run: `npx tsc --noEmit && npx vitest run` → clean / all green.
Run: `npm run build` → green.

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: paginate players grid + rankings tables at 25/page; lift 300-row fetch cap"
```

---

### Task 5: /rankings page — fetch all ranked, tables paginate

**Files:**
- Modify: `src/app/rankings/page.tsx:37` — `.limit(100)` → `.limit(1000)`; update the stale comment on line 30 ("top-100 limit" → "all ranked players; tables paginate client-side").

**Step 1:** Check how the cohort tables render below line 175 of `rankings/page.tsx`. If they render `RankingsTable`, Task 4 Step 2 already gives them pagination. If they render their own inline `<table>` markup (server), replace that markup with the (now self-paginating, client) `RankingsTable` component, passing the same columns/props it expects — do NOT maintain two table implementations (DRY).

**Step 2:** `npx tsc --noEmit && npm run build` → green.

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: /rankings shows full cohorts with 25/page pagination"
```

---

### Task 6: World tab — clarify team-vs-player ranking (Martika confusion)

**Files:**
- Modify: `src/app/teams/page.tsx:37` — add `level, ranking_national` to the national-players select
- Modify: `src/components/rankings/TeamsHub.tsx` (type at :25, roster block at :431-453, WorldTab header at :468+)

**Step 1:** Extend `NationalPlayer` type with `level: string | null; ranking_national: number | null;`.

**Step 2:** In the expanded-row roster block:
- Retitle `Roster ({matchedPlayers.length})` → `2024 National Roster ({matchedPlayers.length})`.
- Under the title add: `<p className="text-brand-white/35 text-[11px] mb-2">Team ranking above is IFAF's — individual player ranks are separate.</p>`
- On each player line append their real cohort rank chip when ranked:

```tsx
{p.ranking_national != null && (
  <span className="text-brand-yellow/70 text-[10px] font-display ml-1.5">
    {cohortRankLabel(p.level, p.ranking_national)}
  </span>
)}
```

  (import `cohortRankLabel` from `@/lib/rankings/cohort`). So Martika's line reads "Martika Marcucci · DB · CW #1" under Italy (#8) — the confusion self-answers.
- Sort `matchedPlayers` by `ranking_national` (nulls last) so ranked players lead, and keep the existing `.slice(0, 14)` + "+N more".

**Step 3:** In the WorldTab section header (around :468), ensure the intro copy says these are **team** rankings, e.g. subtitle "IFAF national **team** rankings — for individual players see TF Rankings" with a `Link` to `/rankings`. Match existing header styling in the file.

**Step 4:** `npx tsc --noEmit && npm run build` → green.

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: World tab roster shows player cohort rank chips + team-vs-player rank clarification"
```

---

### Task 7: Admin members — delete member + "no player profile" visibility

This is what Ambra actually needs for Tristan/Aleena. **Reminder: do not delete their accounts yourself — they are real users; deletion is Ambra's call via this new UI.**

**Files:**
- Create: `src/app/admin/members/actions.ts`
- Modify: `src/app/admin/members/page.tsx` (pass member playerless state — already derivable via `playerName === null`)
- Modify: `src/app/admin/members/MembersTable.tsx`

**Step 1: Server action**

```ts
// src/app/admin/members/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/eval/admin-client";
import { getAdminUser } from "@/lib/admin";

// Deletes the AUTH ACCOUNT only. Any claimed player profile is unlinked (back to
// unclaimed), never deleted — player rows are managed in /admin/players.
export async function deleteMember(userId: string) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");
  if (admin.id === userId) throw new Error("You cannot delete your own account.");

  const db = createAdminClient();

  const { error: unlinkErr } = await db
    .from("players")
    .update({ claimed_by: null, is_claimed: false, claim_pending: false, claimed_at: null })
    .eq("claimed_by", userId);
  if (unlinkErr) throw new Error(`Failed to unlink player profile: ${unlinkErr.message}`);

  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) throw new Error(`Failed to delete member: ${error.message}`);

  revalidatePath("/admin/members");
}
```

Check `players` column names before writing (`claim_pending`, `claimed_at` — confirm via `src/types/player.ts`); drop any that don't exist. **Also verify FK behavior:** run `select conname, confdeltype from pg_constraint where confrelid = 'auth.users'::regclass;` style check OR simply grep migrations for `references auth.users` — tables like `eval_responses`, `form_drafts`, `iq_best` reference the user. If any FK lacks `on delete cascade`, `deleteUser` will fail — in that case delete those rows explicitly in the action before `deleteUser` (service client, `eq("user_id", userId)`).

**Step 2: MembersTable UI**

- Where `playerName` is null, render a muted badge `No player profile` (instead of blank/"—") in both desktop table and mobile card layouts — this is the "can't see them in certain places" fix.
- Add a Delete action per row (desktop: small trash/text button; mobile card: same). Two-step confirm in-row (first click → "Confirm delete? This removes their login permanently." + Confirm/Cancel), calling `deleteMember(id)` inside `useTransition`; on error, show the message inline. Follow the existing component's state patterns (it already uses client state — see the `next.delete(f)` set logic).
- Never show Delete on the current admin's own row if the current user id is available; otherwise rely on the server-side self-delete guard (which must exist regardless).

**Step 3:** `npx tsc --noEmit && npx vitest run && npm run build` → green. Confirm `src/lib/admin-gating.test.ts` still passes (new action gates via `getAdminUser` — required by the RLS/admin sweep rules in CLAUDE.md).

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: admin members — delete member action + explicit no-player-profile state"
```

---

### Task 8: E2E verification in local preview

**Step 1:** Start the dev server via the Browser pane (`preview_start` with launch.json config, port 3000). Verify:
- `/players` → All Players shows Paginator ("Showing 1–25 of 412"), page 2 shows 26–50; select **High School (18U)** → all 43 HS players reachable across 2 pages; chip reads "College / World (18+)" when CW selected.
- `/rankings` → both cohort tables paginate; HS table reaches rank #43, CW table reaches the last CW rank.
- `/teams` World tab → expand Italy → roster titled "2024 National Roster", Martika's line shows her `CW #…` chip, clarification line present.
- `/admin/members` (sign in as an admin or verify via code review + the gating test if auth-in-browser is impractical) → Tristan Cornet's row shows "No player profile"; delete button renders with confirm step. **Do not actually delete anyone.**
- Resize to 375px: paginator wraps acceptably on `/players` and `/rankings`; if cramped, implement the windowed page-number list noted in Task 3.

**Step 2:** `npx vitest run` (expect 202+ passing, plus new pagination/cohort tests) and `npm run build` → green.

**Step 3: Commit any fixes**, then merge `ambra-round4` → `main` (fast-forward if possible) and push. Do NOT poll the Vercel deploy (owner preference).

---

### Task 9: Report back to Ambra (draft for Daniel to send)

Create `docs/ambra-update-2026-07-19-round4.md` covering:
1. **Tristan Cornet & Aleena Ouellette are real people, not test data** — real Gmail signups (6/27 and 6/25). Tristan signed up but never created a player profile (nothing to approve). Aleena's player profile exists, is approved, and is HS #20 — but she never completed claiming it, so it isn't linked to her login. Ambra now has a Delete Member button in Admin → Members if she ever wants to remove an account — recommend leaving both alone (they're early users). Optional follow-up: reach out to Aleena to finish claiming her profile.
2. **Martika in World ranks** — the World tab ranks national **teams** (Italy is IFAF #8). Martika appears there only as a member of Italy's 2024 roster; her personal rank is CW #1 and now shows next to her name so nobody misreads it again.
3. **Pagination** — players and rankings now show 25 per page with page buttons (mobile too); every player is reachable, nothing is cut off anymore.
4. **(18+)** label added to College/World everywhere, mirroring (18U).

---

## Remember
- These are live-DB-verified findings; don't re-run destructive checks or delete any account.
- `ranking_national` is a per-cohort ordinal since the 2026-07-19 recompute — never render cross-cohort rank comparisons.
- Admin surfaces MUST gate via `getAdminUser` (middleware does not protect them); service-only tables need `createAdminClient`.
- `window.scrollTo` needs `behavior: "instant"` (global smooth-scroll CSS).
- Don't poll the Vercel deploy after pushing.
