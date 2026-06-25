# Loose Ends, National Rosters, Discord Removal & Global Measurements — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Tidy live-site loose ends and ship four owner-requested changes — surface Tika (and full rosters) correctly on the Teams page, add the top‑3 men's & women's national teams + rosters, remove all Discord/community plans and links (refocus on podcast + socials), and make height/weight display in both ft/lbs **and** cm/kg for a global audience.

**Architecture:** Next.js 16 App Router + TypeScript + Tailwind + Supabase (service-role on the server; RLS-locked tables). National rosters live as rows in the `players` table (`level='national'`, `stats.team_designation='national_senior'`); the Teams "World" tab (`src/components/rankings/TeamsHub.tsx`) matches them to IFAF ranking rows in `src/lib/world-rankings.ts` by country. Player measurables live in dedicated `players.height_in` / `players.weight_lbs` integer columns and are rendered by five duplicated `formatHeight` helpers — these get consolidated into one shared metric-aware module. Roster data is seeded via a reviewable JSON file + a `scripts/` seed script (matching the existing `seed-iq.ts` / `seed-eval.ts` pattern), not invented inline.

**Tech Stack:** Next.js 16, TypeScript, Tailwind v3, Supabase JS (`@supabase/supabase-js`), Vitest, Vercel. Supabase project `wxeuybksowhncalrnttl`.

---

## Context the executor must know (verified 2026-06-24 against the live DB)

- **Tika IS already in the DB.** `Martika "Tika" Marcucci` — id `7cdcd6a2-7cf9-4dcf-8993-1f426b4c2b24`, `position=DB`, `country=Italy`, `gender=female`, `level=national`, `stats.team_designation=national_senior`, `stats.roster_year=2024`, `stats.jersey=16`, `stats.club=FIDAF`, `is_claimed=false`. Ambra (`ab5214c7-…`) is in the same roster. **Do not insert a duplicate Tika.** Her apparent absence is caused by the two TeamsHub bugs below.
- **Current national rosters in DB:** Italy W (13), Italy M (12), USA W (12), USA M (12). Each row is `level='national'` + `stats.team_designation='national_senior'` + `stats.roster_year='2024'`.
- **Bug A — gender not filtered.** In `TeamsHub.tsx`, `WorldTab` holds a `gender` toggle but passes the *entire* `players` array to every `WorldTeamRow`, which filters only by `country` and `slice(0,8)`. So the Women's→Italy row shows a men+women mix (25 Italy players cut to 8) — Tika is often not in the first 8. The `NationalPlayer` type and the `/teams` query don't even select `gender`.
- **Bug B — country naming mismatch.** USA national rows have `country='United States'`, but `world-rankings.ts` uses `nation='USA'`. The match is `p.country.toLowerCase() === team.nation.toLowerCase()`, so **the USA roster never renders** on the World tab. New rosters must avoid this; we add a small alias map.
- **Position CHECK constraint** on `players.position`: only `QB | WR | DB | LB | C | Rusher | Utility` are allowed. Seeds must use these.
- **`/teams` page query** (`src/app/teams/page.tsx`) selects national/international players with `.select("id, first_name, last_name, position, country, school_or_team")` and `.or("level.eq.national,level.eq.international")`. We extend the select to include `gender` and `stats`.
- **Measurables today:** dedicated `height_in` (int) + `weight_lbs` (int) columns. Only 3 of 374 players have any value. `formatHeight` is duplicated in `recruit/RecruitBrowser.tsx`, `players/compare/page.tsx`, `players/[id]/page.tsx`, `players/[id]/ShareCardModal.tsx`, `players/[id]/embed/page.tsx`. Weight is rendered as a bare `` `${w} lbs` `` string in each. No metric anywhere. Submit form (`players/submit/page.tsx`) collects ft + in + lbs only; the submit API (`api/players/submit/route.ts:56-99`) merges them into `height_in` / `weight_lbs`.
- **Discord footprint (3 files + sitemap):** `src/app/community/page.tsx` (whole page, `DISCORD_INVITE = "https://discord.gg/talkinflag"`), `src/app/auth/callback/route.ts:97-98` (Discord CTA in welcome email HTML), `src/app/players/[id]/page.tsx:686-692` (Discord community card), `src/components/layout/Footer.tsx:42` (`{ label: "Community", href: "/community" }`), `src/app/sitemap.ts:28` (`/community` entry).
- **Tests:** `npm test` (Vitest, currently 40 passing). `npm run build` must stay green. Dev server: `npm run dev` (port 3000).
- **Roster data is real or it doesn't ship.** Project discipline (see `project_next_steps.md`): never invent player names, quotes, or stats. Phase 4 includes an explicit web-research step; if a full 12 cannot be verified for a nation, seed the verified subset and record the gap in a comment.

**Top‑3 teams to add (per IFAF 2025 world rankings in `world-rankings.ts`):**
- Women: #1 Mexico, #2 USA *(done)*, #3 Great Britain → **add Mexico W, Great Britain W**
- Men: #1 USA *(done)*, #2 Austria, #3 Mexico → **add Austria M, Mexico M**
- Net new rosters: **Mexico (W + M), Great Britain (W), Austria (M)** — 4 rosters.

---

## Phase 0 — Baseline & loose-end display fixes

### Task 0.1: Establish a green baseline

**Step 1:** Run `npm test` — Expected: all pass (≈40).
**Step 2:** Run `npm run build` — Expected: compiles clean.
**Step 3:** If either fails, STOP and report; do not start changes on a red baseline.

### Task 0.2: Fix Bug B — country alias matching (TeamsHub)

**Files:**
- Modify: `src/lib/world-rankings.ts` (add an exported alias helper near `getFlag`)
- Modify: `src/components/rankings/TeamsHub.tsx` (use it in `matchedPlayers` / `matchedCoaches`)

**Step 1: Add a normalizer to `world-rankings.ts`** (below `getFlag`):

```ts
// Maps DB country strings to the IFAF ranking `nation` label.
const NATION_ALIASES: Record<string, string> = {
  "united states": "usa",
  "us": "usa",
  "u.s.a.": "usa",
  "great britain": "great britain",
  "united kingdom": "great britain",
  "uk": "great britain",
};

/** Normalize any country/nation string to a comparable key. */
export function nationKey(value: string | null | undefined): string {
  const v = (value ?? "").trim().toLowerCase();
  return NATION_ALIASES[v] ?? v;
}
```

**Step 2: Use it in `TeamsHub.tsx`** — replace the two filters in `WorldTeamRow`:

```ts
const matchedCoaches = coaches.filter((c) =>
  c.team ? nationKey(c.team).includes(nationKey(team.nation)) : false
);
const matchedPlayers = players.filter((p) => nationKey(p.country) === nationKey(team.nation));
```
Add `nationKey` to the existing `import … from "@/lib/world-rankings"` line.

**Step 3:** `npm run build` — Expected: clean.

**Step 4: Commit**
```bash
git add src/lib/world-rankings.ts src/components/rankings/TeamsHub.tsx
git commit -m "fix(teams): match national rosters via country alias so USA roster renders"
```

### Task 0.3: Fix Bug A — filter World-tab roster by gender

**Files:**
- Modify: `src/app/teams/page.tsx` (select `gender` + `stats`)
- Modify: `src/components/rankings/TeamsHub.tsx` (`NationalPlayer` type, thread `gender` through `WorldTab` → `WorldTeamRow`, filter, sort by jersey, raise/clarify the slice)

**Step 1: Extend the `/teams` query** in `src/app/teams/page.tsx` — change the players select to:
```ts
.select("id, first_name, last_name, position, country, gender, school_or_team, stats")
```

**Step 2: Extend the `NationalPlayer` type** in `TeamsHub.tsx` to include:
```ts
gender?: "male" | "female" | null;
stats?: Record<string, unknown> | null;
```

**Step 3: Map the ranking gender toggle to DB gender.** In `WorldTab`, derive a DB value from the existing `gender` state (`"mens" | "womens"`):
```ts
const dbGender = gender === "mens" ? "male" : "female";
```
Pass `genderFilter={dbGender}` into each `<WorldTeamRow … />`.

**Step 4: Filter + order in `WorldTeamRow`.** Add `genderFilter: "male" | "female"` to its props and update the player match:
```ts
const matchedPlayers = players
  .filter((p) => nationKey(p.country) === nationKey(team.nation) && p.gender === genderFilter)
  .sort((a, b) => {
    const ja = Number((a.stats as Record<string, unknown>)?.jersey ?? 999);
    const jb = Number((b.stats as Record<string, unknown>)?.jersey ?? 999);
    return ja - jb;
  });
```
Bump the visible roster cap from `slice(0, 8)` to `slice(0, 14)` (a national roster is ~12), and keep the `+N more` line.

**Step 5: Verify in the browser.** `npm run dev`, open `http://localhost:3000/teams` → World tab → **Women's** → expand **Italy**: roster shows only Italy women, Tika (#16) included; expand **USA** under Women's: 12-woman USA roster now appears (proves Bug B fix). Toggle **Men's** → Italy/USA show only men. Use the preview tools to confirm (snapshot + screenshot).

**Step 6: Commit**
```bash
git add src/app/teams/page.tsx src/components/rankings/TeamsHub.tsx
git commit -m "fix(teams): filter national roster by gender + jersey order; surfaces Tika and full rosters"
```

> After this phase the original "Add Tika to Italy" ask is satisfied at the display layer. Data enrichment for Tika is Task 4.5.

---

## Phase 1 — Remove Discord (refocus on podcast + socials)

> Per owner: drop Discord/community plans and links for now (may revisit). Replace community CTAs with podcast + social CTAs — do not leave dead "Community" nav/links.

### Task 1.1: Delete the community page & sitemap entry

**Files:**
- Delete: `src/app/community/page.tsx` (and the `community/` dir if now empty)
- Modify: `src/app/sitemap.ts` (remove the `/community` entry at line ~28)

**Step 1:** `git rm src/app/community/page.tsx`
**Step 2:** Remove the `/community` object from the array in `sitemap.ts`.
**Step 3:** `grep -rn "/community" src/` — Expected: only the Footer + player-profile refs handled in 1.2/1.3 remain (then none).

### Task 1.2: Remove Community from the footer

**Files:** Modify `src/components/layout/Footer.tsx`

**Step 1:** Delete the `{ label: "Community", href: "/community" }` entry (line ~42).
**Step 2:** If that leaves a column thin, ensure a podcast/social link is present instead (the footer already has Watch & Read + Connect columns — confirm Podcast + the IG/social links remain; add `Podcast → /podcast` to the column if it now has a gap). Keep it minimal.

### Task 1.3: Replace the Discord card on player profiles

**Files:** Modify `src/app/players/[id]/page.tsx` (lines ~684-692)

**Step 1:** Replace the "Players, coaches, and fans on Discord / Join Discord →" card with a podcast/social CTA, e.g. a card linking to `/podcast` ("Listen to Talkin Flag") and the show Instagram (`https://instagram.com/talkinflagshow`). Reuse the surrounding card styling; no Discord text or links remain.

### Task 1.4: Remove Discord from the welcome email

**Files:** Modify `src/app/auth/callback/route.ts` (lines ~97-98)

**Step 1:** Delete the `<a href="https://discord.gg/talkinflag">Join the Discord Community →</a>` block from the email HTML. If a CTA belongs there, swap to "Follow @talkinflagshow" (`https://instagram.com/talkinflagshow`) or the podcast link, matching the email's inline-style pattern.

### Task 1.5: Verify no Discord remains & build

**Step 1:** `grep -rin "discord" src/` — Expected: **no matches**.
**Step 2:** `grep -rn "/community" src/` — Expected: **no matches**.
**Step 3:** `npm run build` — Expected: clean (no broken imports/links).
**Step 4: Commit**
```bash
git add -A
git commit -m "chore: remove Discord/community surfaces; refocus CTAs on podcast + socials"
```

---

## Phase 2 — Global measurements (ft/lbs **and** cm/kg)

> Goal: every place that shows height/weight shows both unit systems, and the submit form lets athletes enter either. Consolidate the 5 duplicate `formatHeight` helpers into one tested module first (DRY).

### Task 2.1: Create the shared, tested measurements module (TDD)

**Files:**
- Create: `src/lib/measurements.ts`
- Create: `src/lib/measurements.test.ts`

**Step 1: Write failing tests** in `src/lib/measurements.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { formatHeight, formatWeight, cmToInches, inchesToCm } from "./measurements";

describe("formatHeight", () => {
  it("formats inches as ft/in plus cm", () => {
    expect(formatHeight(66)).toBe("5'6\" / 168 cm");
  });
  it("returns empty string for null/0", () => {
    expect(formatHeight(null)).toBe("");
    expect(formatHeight(0)).toBe("");
  });
});

describe("formatWeight", () => {
  it("formats lbs plus kg", () => {
    expect(formatWeight(128)).toBe("128 lbs / 58 kg");
  });
  it("returns empty string for null/0", () => {
    expect(formatWeight(null)).toBe("");
  });
});

describe("conversions", () => {
  it("inchesToCm rounds", () => { expect(inchesToCm(66)).toBe(168); });
  it("cmToInches rounds", () => { expect(cmToInches(168)).toBe(66); });
});
```

**Step 2: Run** `npx vitest run src/lib/measurements.test.ts` — Expected: FAIL (module not found).

**Step 3: Implement** `src/lib/measurements.ts`:

```ts
/** Shared, locale-neutral measurement formatting for a global audience. */

export function inchesToCm(inches: number): number {
  return Math.round(inches * 2.54);
}
export function cmToInches(cm: number): number {
  return Math.round(cm / 2.54);
}
export function lbsToKg(lbs: number): number {
  return Math.round(lbs * 0.45359237);
}
export function kgToLbs(kg: number): number {
  return Math.round(kg / 0.45359237);
}

/** "5'6\" / 168 cm" — empty string when missing. */
export function formatHeight(totalInches: number | null | undefined): string {
  if (!totalInches || totalInches <= 0) return "";
  const ft = Math.floor(totalInches / 12);
  const inch = totalInches % 12;
  return `${ft}'${inch}" / ${inchesToCm(totalInches)} cm`;
}

/** "128 lbs / 58 kg" — empty string when missing. */
export function formatWeight(lbs: number | null | undefined): string {
  if (!lbs || lbs <= 0) return "";
  return `${lbs} lbs / ${lbsToKg(lbs)} kg`;
}
```

**Step 4: Run** `npx vitest run src/lib/measurements.test.ts` — Expected: PASS.

**Step 5: Commit**
```bash
git add src/lib/measurements.ts src/lib/measurements.test.ts
git commit -m "feat(measurements): shared ft/cm + lbs/kg formatters with tests"
```

### Task 2.2: Replace the 5 duplicate `formatHeight` + weight strings

**Files (delete the local `formatHeight`, import the shared one, swap weight rendering to `formatWeight`):**
- `src/app/players/[id]/page.tsx` (local `formatHeight` ~line 68; weight at ~443 `` `${player.weight_lbs} lbs` `` → `formatWeight(player.weight_lbs)`)
- `src/app/recruit/RecruitBrowser.tsx` (`formatHeight` ~28; weight push ~122)
- `src/app/players/compare/page.tsx` (`formatHeight` ~47; weight ~101)
- `src/app/players/[id]/ShareCardModal.tsx` (`formatHeight` ~21; any `lbs` string)
- `src/app/players/[id]/embed/page.tsx` (`formatHeight` ~8; any `lbs` string)

**Step 1:** In each file, delete the local `function formatHeight(...)` and add `import { formatHeight, formatWeight } from "@/lib/measurements";` (merge with existing imports). Replace each `` `${x} lbs` `` weight render with `formatWeight(x)`.

> Note on the OG image + share card: `opengraph-image.tsx` and the `ShareCardModal` render to fixed-size cards. Verify the longer dual-unit string (e.g. `5'6" / 168 cm`) still fits; if a card overflows, keep the imperial-only form **there only** (`${ft}'${inch}"`) via a small local fallback and leave a `// card width constraint` comment. Profiles, compare, recruit, and embed should show both.

**Step 2:** `npx tsc --noEmit` (or `npm run build`) — Expected: no type errors, no unused-var warnings for removed helpers.

**Step 3:** `npm run dev` → open a profile that has measurables (Ambra Marcucci has `height_in=66`, `weight_lbs=128`) at `/players/ab5214c7-17bf-4f63-ab38-6a6ebe1c9d2c`. Confirm it shows `5'6" / 168 cm` and `128 lbs / 58 kg`. Use preview snapshot/screenshot.

**Step 4: Commit**
```bash
git add -A
git commit -m "refactor(measurements): use shared dual-unit formatters site-wide (ft/cm, lbs/kg)"
```

### Task 2.3: Accept metric input on the submit form + API

**Files:**
- Modify: `src/app/players/submit/page.tsx` (measurables block ~205-230)
- Modify: `src/app/api/players/submit/route.ts` (height/weight parse ~56-99)

**Step 1: Add a unit toggle** (Imperial / Metric) to the Measurables section in `submit/page.tsx`. Imperial keeps the existing `height_ft` + `height_in_rem` + `weight_lbs` inputs. Metric shows `height_cm` + `weight_kg` inputs (label `cm` / `kg`). Toggle controlled by local state; add a hidden `unit` field (`"imperial" | "metric"`) submitted with the form. Keep Tailwind/brand styling consistent with the existing inputs.

**Step 2: Parse metric in the API.** In `route.ts`, after the existing imperial parse, handle metric → still store canonical `height_in` / `weight_lbs` (the DB columns stay imperial-canonical; the UI converts both ways):
```ts
// Metric path: convert to canonical imperial columns.
if (body.unit === "metric") {
  const cm = parseInt(body.height_cm ?? "");
  if (!isNaN(cm) && cm >= 120 && cm <= 244) height_in = cmToInches(cm);
  const kg = parseInt(body.weight_kg ?? "");
  if (!isNaN(kg) && kg >= 36 && kg <= 181) weight_lbs = kgToLbs(kg);
}
```
Import `cmToInches, kgToLbs` from `@/lib/measurements`. Keep the existing imperial range guards as-is.

**Step 3: Test the round-trip.** `npm run dev` → `/players/submit`, switch to Metric, enter `168 cm` / `58 kg`, submit a test athlete. Verify via Supabase (`execute_sql`) that the row stored `height_in≈66`, `weight_lbs≈128`; then confirm the profile renders `5'6" / 168 cm`. Delete the test athlete afterward.

**Step 4:** `npm test` + `npm run build` — Expected: green.

**Step 5: Commit**
```bash
git add -A
git commit -m "feat(submit): metric (cm/kg) input option, stored as canonical imperial"
```

---

## Phase 3 — Add top‑3 men's & women's national rosters

> Add **Mexico W, Great Britain W, Austria M, Mexico M** (USA + Italy already in DB). Real data only.

### Task 3.1: Research & assemble verified roster data

**Files:** Create `scripts/data/national-rosters-2024.json`

**Step 1:** Using WebSearch/WebFetch, gather the **2024 IFAF Flag Football World Championship** (Lahti, FIN) rosters (or the most recent verifiable national roster) for: Mexico Women, Great Britain Women, Austria Men, Mexico Men. Capture per player: `first_name`, `last_name`, `position` (map to the allowed set `QB|WR|DB|LB|C|Rusher|Utility`), `jersey` (if known), `club` (if known). Also capture each team's **head coach** name and any standout **key players**.

**Step 2:** Write `scripts/data/national-rosters-2024.json` in this shape:
```json
{
  "rosters": [
    {
      "country": "Mexico",
      "gender": "female",
      "roster_year": "2024",
      "team_designation": "national_senior",
      "source": "ifaf.org",
      "players": [
        { "first_name": "…", "last_name": "…", "position": "QB", "jersey": "7", "club": "…" }
      ]
    }
  ]
}
```
Use `country` strings that match `world-rankings.ts` `nation` labels exactly: `"Mexico"`, `"Great Britain"`, `"Austria"`. (USA's alias is handled in Task 0.2, but new data should match directly.)

**Step 3:** If a full 12 can't be verified for a nation, include only the verified players and add a `"_note"` field explaining the gap. **Do not pad with invented names.**

### Task 3.2: Write the idempotent seed script

**Files:** Create `scripts/seed-national-rosters.ts` (model on `scripts/seed-iq.ts` env-loading header)

**Step 1:** Reuse the `.env.local` loader + `createClient(url, SUPABASE_SERVICE_ROLE_KEY)` header from `seed-iq.ts`.

**Step 2:** For each roster player, upsert with a stable natural key to stay idempotent (re-runnable without duplicates). Insert columns:
- `first_name`, `last_name`, `position`, `gender`, `country`, `level: 'national'`, `is_verified: false`, `is_claimed: false`
- `stats`: `{ team_designation, roster_year, source, jersey, club }`

Guard against duplicates by checking for an existing row matching `(first_name, last_name, country, gender, level='national')` before insert; skip if present (so Italy/USA and any re-run are untouched). Log inserted vs skipped counts per team.

**Step 3:** Validate every `position` is in the allowed set before insert; throw on violation (protects the CHECK constraint).

### Task 3.3: Run the seed & verify counts

**Step 1:** `npx tsx scripts/seed-national-rosters.ts` — Expected: logs ~12 inserted per new team, 0 errors.

**Step 2:** Verify via `execute_sql`:
```sql
SELECT country, gender, count(*) FROM players
WHERE stats->>'team_designation'='national_senior'
GROUP BY 1,2 ORDER BY 1,2;
```
Expected: Italy W/M, USA W/M **plus** Mexico W, Mexico M, Great Britain W, Austria M.

**Step 3: Commit**
```bash
git add scripts/seed-national-rosters.ts scripts/data/national-rosters-2024.json
git commit -m "feat(data): seed Mexico W/M, Great Britain W, Austria M national rosters (2024 IFAF)"
```

### Task 3.4: Enrich `world-rankings.ts` with the new teams' coaches & key players

**Files:** Modify `src/lib/world-rankings.ts`

**Step 1:** For Mexico (W #1, M #3), Great Britain (W #3), and Austria (M #2), add `headCoach` and `keyPlayers` (3-5, verified) to their `WorldTeam` entries, matching the depth of the existing USA/Italy entries. Mexico Women's `keyPlayers` already lists Diana Flores et al. — extend consistently. Only verified names.

**Step 2:** `npm run build` — Expected: clean.

**Step 3: Commit**
```bash
git add src/lib/world-rankings.ts
git commit -m "content(teams): add coaches + key players for Mexico, Great Britain, Austria"
```

### Task 3.5: Enrich Tika's roster record (the original ask, data layer)

**Files:** none (DB update via `execute_sql` / `apply_migration` is not needed — this is a data edit)

**Step 1:** Confirm Tika's club. Memory says `stats.club='FIDAF'` (the federation, not a club). If a verified club is found in Task 3.1 research, update her row:
```sql
UPDATE players
SET stats = stats || jsonb_build_object('club', '<verified club>')
WHERE id = '7cdcd6a2-7cf9-4dcf-8993-1f426b4c2b24';
```
If no verified club, leave as-is (do not guess).

**Step 2:** Confirm she renders under Teams → World → Women's → Italy (she should, post Phase 0). Screenshot as proof.

---

## Phase 4 — Full verification & ship

### Task 4.1: Automated checks

**Step 1:** `npm test` — Expected: all pass (40 baseline + new measurements tests).
**Step 2:** `npm run build` — Expected: clean.
**Step 3:** `grep -rin "discord" src/` and `grep -rn "/community" src/` — Expected: no matches.

### Task 4.2: Browser smoke test (preview tools)

**Step 1:** `npm run dev`. Verify, capturing a screenshot for each:
- `/teams` → World → Women's → expand Italy (Tika #16 visible), USA (12 women visible), Mexico, Great Britain.
- `/teams` → World → Men's → expand USA, Austria, Mexico, Italy (men only, no women bleed-through).
- A profile with measurables shows dual units; `/players/submit` Metric toggle works.
- Footer has no Community link; a player profile shows the podcast/social card (no Discord).

**Step 2:** Check `preview_console_logs` for errors on each route — Expected: none.

### Task 4.3: Ship

**Step 1:** Confirm on a feature branch (not committing straight to `main` if that's the convention — check `git branch`). Push and let Vercel build, or merge per the owner's normal flow.
**Step 2:** After deploy READY, re-run the `/teams` checks against `https://talkinflag.com`.
**Step 3:** Update memory: in `project_next_steps.md` note Discord removed, top‑3 rosters added, dual-unit measurements live, and the two TeamsHub bugs fixed.

---

## Out of scope / owner decisions (surface, don't build)

- **Drop `_backup_*` tables** (`_backup_players_20260606`, `_backup_events_20260606`) — long-pending owner action; destructive, leave to explicit owner confirmation (run `DROP TABLE IF EXISTS …` only when they say go).
- **Mexico appears in both** men's and women's top 3 — adding it once per gender covers both; no extra work, just noted so the executor isn't surprised by two Mexico rosters.
- **Reviving the community feature** later (Discord or otherwise) — explicitly deferred by the owner.
- **Per-user unit preference** (auto-detect locale, remember imperial vs metric) — not requested; current approach shows both everywhere, which fully satisfies the global requirement.
