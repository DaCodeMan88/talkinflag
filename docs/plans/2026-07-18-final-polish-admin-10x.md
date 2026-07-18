# Final Polish + Admin Dashboard 10x — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix Ambra's reported bugs (grad/roster year not saving, stats-card mobile overflow, claim-step confusion), ship member-facing polish (clickable IG+TikTok socials, metric-unit entry), rebuild the admin area as a sidebar shell with a real Overview and a Members directory, and reconcile `/privacy` + `/terms` with Ambra's edited draft.

**Architecture:** Next.js 15 App Router + Tailwind + Supabase. Admin gets a persistent left sidebar via `src/app/admin/layout.tsx` (client nav component, mobile drawer). Members directory reads `auth.users` via the service-role client (`supabase.auth.admin.listUsers` — only 6 users today, single page). All admin surfaces keep the existing `getAdminUser()` gate (middleware does NOT protect them). Public profile keeps inches/lbs as the canonical stored units; metric entry is a client-side conversion at the form layer.

**Tech Stack:** Next.js 16.2 / React 19 / Tailwind / Supabase (project `wxeuybksowhncalrnttl`) / Vitest.

**Brand rules (all new UI):** bg `#000`/`#0d0d0d`, borders `white/10`, accent `#FDDD58` (`brand-yellow`), headings `font-display uppercase tracking-widest`, body Inter. Match the existing admin pages' look — this is a layout/IA upgrade, not a re-theme.

---

## Verified root causes (investigated 2026-07-18, live DB)

1. **"Graduation class / year doesn't save":** `src/app/api/players/[id]/profile/route.ts:76-79` silently nulls any `grad_year` outside **2024–2032**. Ambra enters 2017 (she's a doctorate-holding adult) → saved as `null`, form says "Saved ✓". Her DB `grad_year` is null right now.
2. **"Roster year won't update":** `roster_year` is a guarded field editable only through the ChangeRequestForm at the bottom of `/dashboard/edit` ("Basic Info (needs review)"). `profile_change_requests` has **zero rows ever** — she never found/completed that flow. The main form has no roster-year input, so from her POV "editing does nothing."
3. **Public "Stats" grid ugliness/overflow:** `src/app/players/[id]/page.tsx:697-711` dumps every leftover `stats` JSONB key (`roster_year`, `team_designation`, `instagram`, `jersey`, `club`, `nickname`, `wingspan_in`…) into a `grid-cols-2` of fixed cards — raw key names as labels, long values (`national_senior`, `ambramarcucci`) overflow on 375px.
4. **"Player Claim" checklist never checks off — REAL BUG, affects every user:** the dashboard player query (`src/app/dashboard/page.tsx:60`) selects a **`team` column that does not exist** in `players` (verified against `information_schema` 2026-07-18; the column is `school_or_team`). PostgREST rejects the whole query → `player` is `null` for **everyone** → the "Find & claim your player profile" step can never complete and the "No player profile linked" empty state always renders, even for Ambra's correctly claimed+approved row. Introduced in the original claim-flow commit (`7909977`); the prod E2E that would have caught it was never run. Sole occurrence in the codebase. **Fix before stress test — this is Task 0.**
5. **Admin players capped at 100:** `src/app/admin/players/page.tsx:29` `.limit(100)` with no pagination; DB has **412 players**.
6. **Report an Issue tool:** ALREADY BUILT — `ReportProfileButton` renders on every profile (`src/app/players/[id]/page.tsx:438`), feeds `profile_reports`, reviewed at `/admin/reports`. Ambra's Terms draft can reference it truthfully. Tell her this in the wrap-up message.
7. **Governing law:** Ambra's draft says Italy/Florence; Daniel says the business license will most likely be **Texas** — decision OPEN. Do not commit either as final; see Task 12.

---

## Task 0: Fix the phantom `team` column — dashboard claim card (DO FIRST)

**Files:**
- Modify: `src/app/dashboard/page.tsx:60` (the select) and `:226` (the render fallback)

**Step 1:** In the players select, remove `team, ` from the column list (keep `school_or_team`, already present). At line 226, change `{player.school_or_team ?? player.team}` to `{player.school_or_team}`.

**Step 2:** Make this class of bug loud instead of silent: destructure `error` from the query and log it —

```ts
const [{ data: player, error: playerErr }, { data: coachApp }] = await Promise.all([...]);
if (playerErr) console.error("Dashboard player query failed:", playerErr.message);
```

**Step 3: Verify end-to-end** — `npx tsx scripts/e2e-claim-check.ts setup` → consume the printed link → `/dashboard` must now show the "✓ Claimed" profile card AND the checklist's first item checked ("Your player profile · View") → `teardown`. (Known caveat: if the magic link lands on `/auth/auth-error`, consume via `token_hash`/`verifyOtp` — link-consumption issue, not data.) Alternatively verify in local preview with a claimed test session. Screenshot the checked checklist.

**Step 4:** `npx tsc --noEmit`; commit: `fix: dashboard selected nonexistent players.team column, breaking claim card + checklist for all users`

---

## Task 1: grad_year validation — accept real graduation years, stop silent nulling

**Files:**
- Modify: `src/lib/profile-edit.ts` (add `sanitizeGradYear`)
- Modify: `src/app/api/players/[id]/profile/route.ts:76-79` (use it)
- Test: `src/lib/profile-edit.test.ts`

**Step 1: Write failing tests** — append to `src/lib/profile-edit.test.ts`:

```ts
import { sanitizeGradYear } from "./profile-edit";

describe("sanitizeGradYear", () => {
  it("accepts past graduation years (adults exist)", () => {
    expect(sanitizeGradYear("2017")).toBe(2017);
    expect(sanitizeGradYear(1995)).toBe(1995);
  });
  it("accepts near-future years", () => {
    expect(sanitizeGradYear("2032")).toBe(2032);
  });
  it("rejects garbage and out-of-range", () => {
    expect(sanitizeGradYear("abc")).toBeNull();
    expect(sanitizeGradYear("1901")).toBeNull();
    expect(sanitizeGradYear("2050")).toBeNull();
    expect(sanitizeGradYear("")).toBeNull();
  });
});
```

**Step 2:** `npm test -- profile-edit` → FAIL (`sanitizeGradYear` not exported).

**Step 3: Implement** in `src/lib/profile-edit.ts`:

```ts
/** Graduation year: any plausible HS/college year, past or future. */
export function sanitizeGradYear(v: unknown): number | null {
  const n = parseInt(String(v), 10);
  return isNaN(n) || n < 1950 || n > 2040 ? null : n;
}
```

In `route.ts` replace the inline block (lines 76–79) with:

```ts
  if (body.grad_year !== undefined) {
    identity.grad_year = sanitizeGradYear(body.grad_year);
  }
```

(import `sanitizeGradYear` alongside the existing imports from `@/lib/profile-edit`).

**Step 4:** `npm test -- profile-edit` → PASS. `npx tsc --noEmit` → clean.

**Step 5:** Commit: `fix: accept past graduation years instead of silently nulling them`

---

## Task 2: Surface roster-year editing where users expect it

Make guarded-field editing discoverable and stateful instead of a generic dropdown form nobody finds.

**Files:**
- Modify: `src/app/dashboard/edit/page.tsx` (fetch the player's pending change requests, pass down)
- Modify: `src/app/dashboard/edit/ChangeRequestForm.tsx` (show pending requests + per-field "Request change" rows)

**Step 1:** In `page.tsx`, after the player fetch, load pending requests with the same `db` (service) client:

```ts
  const { data: pendingRequests } = await db
    .from("profile_change_requests")
    .select("field, new_value, status, created_at")
    .eq("player_id", player.id)
    .eq("status", "pending");
```

Pass `pendingRequests={pendingRequests ?? []}` into `<ChangeRequestForm />`.

**Step 2:** Rework `ChangeRequestForm` UX (keep all submit logic, endpoint, and error handling identical):
- New prop: `pendingRequests: { field: string; new_value: string; created_at: string }[]`.
- Replace the field `<select>` with a **stacked list of the 5 guarded fields**, each row showing: label, current value, and either a "Request change →" button (expands the input inline for just that field) or — when a pending request exists for that field — a yellow chip: `Pending review: "{new_value}"` with no input (server already 409s duplicates; now the UI explains why).
- After a successful submit, add the new request to local pending state so the row flips to the chip immediately.
- Keep the roster-year numeric input and level select variants for the inline editor.

**Step 3:** Verify in browser (preview_start `dev`, sign in as a claimed test user or use `scripts/e2e-claim-check.ts setup`): `/dashboard/edit` shows the five rows, submitting a roster-year change creates a `profile_change_requests` row and flips the UI to "Pending review".

**Step 4:** `npm test` (change-request tests still green), `npx tsc --noEmit`.

**Step 5:** Commit: `feat: per-field change-request rows with pending status on edit profile`

---

## Task 3: Curate the public Stats card (kills mobile overflow + raw keys)

**Files:**
- Modify: `src/app/players/[id]/page.tsx`

**Step 1:** Stop dumping unknown JSONB keys. Replace the `rawStats` computation (lines 242–244) with an explicit allowlist + labels:

```ts
const IDENTITY_STAT_KEYS = ["club", "jersey", "nickname", "roster_year"] as const;
const IDENTITY_STAT_LABELS: Record<string, string> = {
  club: "Club",
  jersey: "Jersey #",
  nickname: "Nickname",
  roster_year: "Roster Year",
};
const identityStats = IDENTITY_STAT_KEYS
  .filter((k) => hasDisplayableValue(ext[k]))
  .map((k) => ({ key: k, label: IDENTITY_STAT_LABELS[k], value: String(ext[k]) }));
```

Internal keys (`team_designation`, `source`, `seed_batch`, `instagram` [rendered in Links], `wingspan_in` [already in Profile card]) never render.

**Step 2:** Replace the Stats section markup (lines 697–711). Requirements:
- Title stays "Stats" style; grid becomes `grid grid-cols-2 gap-px bg-brand-white/10` (2-up even on mobile is fine once values are short/known).
- Cell: `bg-[#0d0d0d] p-4 min-w-0 text-center`; value `font-display text-xl md:text-2xl text-brand-white break-words`; label `text-brand-white/40 text-[10px] uppercase tracking-widest mt-1`.
- `min-w-0` + `break-words` are the actual overflow fix — keep them.

**Step 3:** Verify: preview `/players/ab5214c7-17bf-4f63-ab38-6a6ebe1c9d2c` (Ambra) at 375px (`resize_window` mobile): card shows Club / Jersey # / Nickname / Roster Year with clean labels, nothing clipped, no `team designation` row. Screenshot for proof.

**Step 4:** Commit: `fix: curated stats card with labels, hides internal keys, no mobile overflow`

---

## Task 4: TikTok support — schema + API + edit form

**Files:**
- Create: `supabase/migrations/015_player_tiktok.sql`
- Modify: `src/types/player.ts` (add `tiktok?: string | null`)
- Modify: `src/app/api/players/[id]/profile/route.ts` (accept `tiktok` like `instagram`)
- Modify: `src/app/dashboard/edit/page.tsx` + `EditProfileForm.tsx` (field next to Instagram)

**Step 1: Migration** (`015_player_tiktok.sql`):

```sql
alter table players add column if not exists tiktok text;
```

Apply with the Supabase MCP `apply_migration` (name `player_tiktok`) — same flow as `014`.

**Step 2:** In the PATCH route, mirror the instagram handler (after line 40):

```ts
  if (body.tiktok !== undefined) {
    const handle = String(body.tiktok).replace(/^@/, "").slice(0, 60);
    identity.tiktok = handle || null;
  }
```

**Step 3:** Edit form: add `tiktok` to the player prop interface, page-level prop plumbing (`tiktok: player.tiktok ?? ""`), a `useState`, the autosave-draft value object, `applyDraft`, the PATCH body, and an input directly below the Instagram input labeled "TikTok" with placeholder `@username` (copy the Instagram input exactly).

**Step 4:** Verify: save a TikTok handle via the form; `execute_sql`: `select tiktok from players where id='ab5214c7-...'` shows it. `npx tsc --noEmit` clean.

**Step 5:** Commit: `feat: tiktok handle on player profiles (schema, api, edit form)`

---

## Task 5: Redesign the Links card — icon + @handle, both clickable

**Files:**
- Create: `src/components/players/SocialLinks.tsx`
- Modify: `src/app/players/[id]/page.tsx` (use it; add TikTok to `sameAs` JSON-LD)

**Step 1: Component** — server component, no state:

```tsx
import { hasDisplayableValue } from "@/lib/profile-visibility";

function handleOf(v: string): string {
  return v.replace(/^https?:\/\/(www\.)?(instagram\.com|tiktok\.com)\//i, "")
    .replace(/^@/, "").replace(/\/+$/, "");
}

export default function SocialLinks({ instagram, tiktok }: {
  instagram?: string | null; tiktok?: string | null;
}) {
  const items = [
    hasDisplayableValue(instagram) && {
      label: "Instagram",
      handle: handleOf(instagram!),
      href: `https://instagram.com/${handleOf(instagram!)}`,
      icon: <InstagramIcon />,
    },
    hasDisplayableValue(tiktok) && {
      label: "TikTok",
      handle: handleOf(tiktok!),
      href: `https://tiktok.com/@${handleOf(tiktok!)}`,
      icon: <TikTokIcon />,
    },
  ].filter(Boolean) as { label: string; handle: string; href: string; icon: React.ReactNode }[];

  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      {items.map((s) => (
        <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
          aria-label={`${s.label}: @${s.handle}`}
          className="flex items-center gap-3 border border-brand-white/10 hover:border-brand-yellow/50 px-3 py-2.5 group transition-colors min-w-0">
          <span className="text-brand-white/50 group-hover:text-brand-yellow transition-colors shrink-0">{s.icon}</span>
          <span className="text-brand-white/80 group-hover:text-brand-white text-sm truncate">@{s.handle}</span>
          <span className="ml-auto text-brand-white/20 group-hover:text-brand-yellow text-xs shrink-0">↗</span>
        </a>
      ))}
    </div>
  );
}
```

Add inline 16×16 `currentColor` SVG icons in the same file: `InstagramIcon` (rounded-square + circle + dot) and `TikTokIcon` (the note glyph — draw the standard single-path TikTok logo shape, `fill="currentColor"`). No new deps.

**Step 2:** In the profile page Links `SideCard` (lines 572–599): keep the Highlight Reel link, replace the bare instagram `<a>` with `<SocialLinks instagram={player.instagram} tiktok={player.tiktok} />`; update the card's render condition to include `hasDisplayableValue(player.tiktok)`. In the Person JSON-LD `sameAs` block (line 276-278), also push `https://tiktok.com/@{handle}` when tiktok is set.

**Step 3:** Verify at 375px on Ambra's profile: icon rows render, tap targets are full-width, links open the right URLs (check `href` via read_page). Screenshot.

**Step 4:** Commit: `feat: icon-based clickable social links (IG + TikTok) on profiles`

---

## Task 6: Metric units option for height/weight (and wingspan)

Store stays imperial (`height_in`, `weight_lbs` — no schema change, `formatHeight/formatWeight` already display both). Add an entry-unit toggle in the edit form using the existing converters in `src/lib/measurements.ts`.

**Files:**
- Modify: `src/app/dashboard/edit/EditProfileForm.tsx`

**Step 1:** Add `const [units, setUnits] = useState<"imperial" | "metric">("imperial");` and a small segmented toggle at the top of the Measurables section: two buttons `FT / LBS` and `CM / KG` (active = yellow bg black text, inactive = `border-white/10 text-white/40`).

**Step 2:** Metric mode swaps the inputs (state additions: `heightCm`, `weightKg`, `wingspanCm` strings):
- Height: single "Height (cm)" number input replacing the ft/in pair.
- Weight: "Weight (kg)"; Wingspan: "Wingspan (cm)".
- On toggle switch, convert whatever is currently entered (`inchesToCm`/`cmToInches`, `lbsToKg`/`kgToLbs` from `@/lib/measurements`) so no data is lost; blank stays blank.
- In `handleSave`, the PATCH body always sends inches/lbs: when `units === "metric"`, compute `height_in: heightCm ? cmToInches(parseInt(heightCm)) : null`, `weight_lbs: weightKg ? kgToLbs(parseInt(weightKg)) : null`, `wingspan_in: wingspanCm ? cmToInches(parseInt(wingspanCm)) : null`.
- Persist the preference in the autosave draft (`units` key) so it survives resume.

**Step 3:** Verify in preview: toggle to CM/KG, enter 175 cm / 65 kg, save; `execute_sql` shows `height_in=69, weight_lbs=143`-style converted values; public profile renders `5'9" / 175 cm`. Toggle back shows converted ft/in.

**Step 4:** `npx tsc --noEmit`; commit: `feat: metric (cm/kg) entry option for measurables`

---

## Task 7: Admin shell — left sidebar layout

**Files:**
- Create: `src/app/admin/AdminSidebar.tsx` (client)
- Modify: `src/app/admin/layout.tsx`

**Step 1: Sidebar component.** `"use client"`, uses `usePathname()` for active state. Nav model:

```ts
const NAV = [
  { group: "Overview", items: [
    { label: "Dashboard", href: "/admin" },
    { label: "Members", href: "/admin/members" },
  ]},
  { group: "Database", items: [
    { label: "Players", href: "/admin/players" },
    { label: "Coaches", href: "/admin/coaches" },
    { label: "Scouts", href: "/admin/scouts" },
    { label: "TF Rankings", href: "/admin/rankings" },
    { label: "Featured Athlete", href: "/admin/featured" },
  ]},
  { group: "Review Queues", items: [
    { label: "Claims", href: "/admin/claims" },
    { label: "Change Requests", href: "/admin/change-requests" },
    { label: "Verifications", href: "/admin/verifications" },
    { label: "Highlights", href: "/admin/highlights" },
    { label: "Events", href: "/admin/events" },
    { label: "Career Updates", href: "/admin/credentials" },
    { label: "Reports", href: "/admin/reports" },
  ]},
  { group: "Inbox", items: [
    { label: "Messages", href: "/admin/messages" },
  ]},
];
```

Optional per-item `count?: number` badge rendered as the existing yellow pill; the layout passes counts (Step 2). Active item: `border-l-2 border-[#FDDD58] bg-white/5 text-[#FDDD58]`; idle: `text-white/50 hover:text-white`. Group headers: `text-white/25 text-[10px] font-display uppercase tracking-widest px-4 pt-5 pb-1`. Top of sidebar: TALKIN FLAG wordmark link to `/admin`, bottom: "← Back to site".

**Responsive:** desktop (`lg:`) fixed `w-60` column, full height, `border-r border-white/10`, scrollable. Below `lg`: hidden behind a hamburger in a slim top bar (`fixed` overlay drawer, close on nav click + backdrop click). State is a simple `useState(false)`.

**Step 2: Layout.** Rewrite `layout.tsx` as an async server component: keep it auth-agnostic (each page still gates itself), fetch the pending counts server-side only if cheap — simpler: fetch NO counts in layout (counts stay on the Overview page; sidebar badges are a stretch goal, skip if it drags). Markup:

```tsx
<div className="min-h-screen bg-black text-white lg:flex">
  <AdminSidebar />
  <main className="flex-1 min-w-0">{children}</main>
</div>
```

**Step 3:** Widen page containers: in each `/admin/*` page, change `max-w-2xl`/`max-w-3xl mx-auto` wrappers to `max-w-6xl` (the sidebar now owns navigation; content can use the screen). Do it mechanically: `grep -rn "max-w-2xl mx-auto\|max-w-3xl mx-auto" src/app/admin` and update each. Remove the now-redundant "← Admin" back links at the top of sub-pages.

**Step 4:** Verify in preview as an admin (`ADMIN_EMAILS` account) at desktop + 375px: sidebar renders, drawer opens/closes, every nav item routes, no horizontal scroll. Screenshot both widths.

**Step 5:** Commit: `feat: admin sidebar shell with grouped nav (desktop rail + mobile drawer)`

---

## Task 8: Admin Overview page — stat cards + queue summary

Rebuild `/admin` (`src/app/admin/page.tsx`) from a link list into an actual overview. Keep `getAdminUser()` gate, `force-dynamic`, and the service-client counts — extend them.

**Step 1:** Add member/growth queries alongside the existing pending counts (all via `createAdminClient()`):

```ts
const now = Date.now();
const weekAgo = new Date(now - 7 * 864e5).toISOString();
const monthAgo = new Date(now - 30 * 864e5).toISOString();
const { data: usersPage } = await adminDb.auth.admin.listUsers({ page: 1, perPage: 1000 });
const users = usersPage?.users ?? [];
const totalMembers = users.length;
const newThisWeek = users.filter((u) => u.created_at >= weekAgo).length;
const newThisMonth = users.filter((u) => u.created_at >= monthAgo).length;
```

Plus counts: `players` total, `is_claimed`, `is_verified`, `eval_responses` total + `gte("created_at", weekAgo)`.

**Step 2:** Layout (top to bottom):
1. Header: "Admin" + pending summary line (keep).
2. **Needs attention** strip: horizontally-wrapping chips, one per queue with `count > 0`, each `Link` — `bg-[#FDDD58] text-black font-display text-xs px-3 py-2` with `{count} {label} →`. All-clear renders `✓ All queues clear`.
3. **Stat card grid** `grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/10`: Members (+`{newThisWeek} this week` subline), New this month, Players (412), Claimed, Verified (+% subline), Evals completed (+this week subline), Open reports, Pending claims. Card: `bg-[#0d0d0d] p-5`, value `font-display text-3xl`, label `text-white/40 text-[10px] uppercase tracking-widest`, subline `text-[#FDDD58] text-xs mt-1`.
4. **Queues list**: keep the existing sections list (it's good), minus items promoted to chips — actually keep all, it doubles as nav for mobile.

**Step 3:** Verify in preview: numbers match a spot-check via `execute_sql`; all links work; 375px looks right (2-col cards). Screenshot.

**Step 4:** Commit: `feat: admin overview with member growth + database stat cards`

---

## Task 9: Members directory — `/admin/members`

**Files:**
- Create: `src/app/admin/members/page.tsx` (server)
- Create: `src/app/admin/members/MembersTable.tsx` (client — search/filter over a small dataset)

**Step 1: Server page.** Gate with `getAdminUser()`, `force-dynamic`. Build one `MemberRow[]` server-side:

```ts
interface MemberRow {
  id: string; email: string; createdAt: string; lastSignInAt: string | null;
  playerName: string | null; playerId: string | null; claimPending: boolean;
  isVerifiedPlayer: boolean; profilePct: number | null;
  coachName: string | null; coachVerified: boolean;
  evalCount: number; lastEvalAt: string | null; iqBest: number | null;
}
```

Sources (all `createAdminClient()`):
- `auth.admin.listUsers({ page: 1, perPage: 1000 })` — id, email, created_at, last_sign_in_at.
- `players`: `select("id, first_name, last_name, claimed_by, claim_pending, is_verified, photo_url, bio, instagram, highlight_url, height_in, weight_lbs, stats").not("claimed_by", "is", null)` → map by `claimed_by`; compute `profilePct` with the same field list as `completionScore` in `src/app/dashboard/page.tsx` (copy the helper into this file or export it — export from a new `src/lib/profile/completion.ts` and reuse in both places; prefer the extraction, it's 12 lines).
- `eval_responses`: `select("user_id, created_at")` → count + max per user.
- `iq_best`: `select("user_id, score_pct").eq("category", "general")`.
- `coaches`: `select("user_id, first_name, last_name, is_verified")`.

**Step 2: Client table.** Props: `members: MemberRow[]`. Features (all client-side filtering — 6 rows today, fine to 1000):
- Search input (email or player/coach name, case-insensitive).
- Filter chips (multi): `Players` (has playerId), `Coaches`, `Verified`, `New this week`, `No profile`.
- Sort select: Newest · Last active · Most evals.
- Row (desktop = table, mobile = stacked cards; use `hidden lg:table` + `lg:hidden` card list): email + join date; linked profile (name → `/admin/players/{id}/edit`, or "—"; "Pending" chip if claimPending); Last sign-in (relative: "2d ago" — small `timeAgo` helper in the file); Evals (`{count}` + last date); IQ best; Profile % with mini progress bar; ✓ Verified chip.
- Header strip above the table: `{n} members · {newThisWeek} new this week` (computed from props).

**Step 3:** Add "Members" to the admin Overview stat card link (`/admin/members`) — already in the sidebar from Task 7.

**Step 4:** Verify in preview: 6 members listed with correct emails/last-sign-ins (cross-check one against `execute_sql` on `auth.users`); search + each filter works; 375px card layout clean. Screenshot.

**Step 5:** `npx tsc --noEmit`; commit: `feat: admin members directory with activity, evals, and profile status`

---

## Task 10: Admin players — real pagination past 100

**Files:**
- Modify: `src/app/admin/players/page.tsx`

**Step 1:** Accept `page` in searchParams (default 1, `PAGE_SIZE = 50`). Replace `.limit(100)` with `.range((page-1)*PAGE_SIZE, page*PAGE_SIZE - 1)`, and change the default (non-search, non-pending) sort to `created_at` descending so the first page is the 50 most recently added players. Search results keep alphabetical order. Get the filtered total: when searching, run the same `.or(...)` filter with `{ count: "exact", head: true }`; otherwise reuse the existing `total`.

**Step 2:** Replace the "Showing first 100" footer with a pager: `← Prev` / `Page {page} of {Math.ceil(count/50)}` / `Next →` as `Link`s preserving `q`/`tab` params; hide Prev on page 1, Next on last page. Show `{count} results` when a search is active.

**Step 3:** Verify: `/admin/players` shows 50 + pager reaching page 9 (412 players); search still narrows; pending tab unaffected.

**Step 4:** Commit: `feat: paginate admin players list (was capped at 100 of 412)`

---

## Task 11: Dashboard claim-query robustness (follow-up to Task 0)

**Step 1:** In `src/app/dashboard/page.tsx`, `.maybeSingle()` returns `null` data on multi-row results, which would silently re-create the Task 0 symptom if duplicate claimed rows ever exist. Change the player fetch to `.order("created_at").limit(1)` + take `data?.[0]`.

**Step 2:** Run `npm test`, verify `/dashboard` still renders correctly in preview, commit: `fix: dashboard resilient to duplicate claimed-player rows`.

**Step 3:** In the wrap-up message to Ambra (Task 13): explain the checklist bug was real (Task 0), fixed, and that after the deploy her dashboard will show the claimed card + checked claim step.

---

## Task 12: Privacy + Terms — reconcile with Ambra's edited draft

Source: `/Users/danielharris/Downloads/TKF Terms & Privacy.md` (Ambra's edits, dated Jul 18 2026). Targets: `src/app/terms/page.tsx`, `src/app/privacy/page.tsx`.

**Step 1:** Diff her draft against the live pages section-by-section. Apply her content changes verbatim where they're factual/copy edits: contact email `talkinflagshow@gmail.com`, age minimum **14**, the sourced-data disclosure wording, retention table, GDPR rights incl. Garante reference, "Report an issue" flow (it exists — Task 6 note), last-updated dates → July 18, 2026.

**Step 2: Governing law — DO NOT finalize.** Her draft says Italy/Florence; the business will most likely form in **Texas**. Keep the governing-law + data-controller-location sections in their current form, add a code comment at each:

```tsx
{/* TODO(governance): jurisdiction pending business formation decision —
    Ambra's draft says Italy/Florence; likely Texas LLC per Daniel 2026-07-18.
    Update BOTH terms (governing law) and privacy (controller) together when decided. */}
```

Also add a line item to the owner-actions section of `CLAUDE.md`: "DECISION OPEN: governing law / entity jurisdiction (Texas LLC vs Italy) — blocks final Terms & Privacy language."

**Step 3:** Her draft ends with an empty "Cookie Policy" heading and the privacy page references a cookie banner. The site has no cookie banner or standalone cookie policy. Do NOT invent one — remove/soften the dangling reference ("manage cookie preferences through your browser") and flag "cookie banner + policy" as an open owner decision in the same CLAUDE.md note.

**Step 4:** Verify both pages in preview (desktop + mobile), links resolve (`/how-rankings-work`, contact). Commit: `content: terms + privacy updated from Ambra's 2026-07-18 review (jurisdiction left open)`

---

## Task 13: Final verification + wrap-up

**Step 1:** Full gate: `npx tsc --noEmit` · `npm test` (expect 188+ passing, plus new) · `npm run build`.

**Step 2:** Browser pass at 375px AND desktop: `/dashboard`, `/dashboard/edit` (units toggle, change-request rows), Ambra's public profile (stats card, social links), `/admin` (sidebar, overview), `/admin/members`, `/admin/players?page=2`, `/privacy`, `/terms`. Screenshots of each changed surface.

**Step 3:** Commit any stragglers, then update `CLAUDE.md` Active Roadmap: mark this plan shipped, list the two open owner decisions (jurisdiction, cookie policy) and Ambra follow-ups.

**Step 4:** Draft (do not send — Daniel sends) the Ambra update message covering: grad-year fix (her 2017 will now save), where roster-year changes live + that they need admin approval (and she IS the admin), the redesigned stats card and admin area, Members tab, Report-an-Issue already exists (screenshot `/admin/reports`), and the jurisdiction question left open pending the Texas decision.

**Step 5:** Push per repo convention (main), note the Vercel deploy id — do NOT poll the deploy (user checks later).

---

## Explicitly out of scope (YAGNI)

- Sidebar pending-count badges live-updating (counts live on Overview).
- Server-side pagination for Members (6 users; revisit past ~1,000).
- TikTok on the share-card PNG and embed widget (profile + JSON-LD only for now).
- Storing metric values natively (canonical units stay in/lbs; display already dual).
- Writing a Cookie Policy (owner decision first).
