# Claim-Visibility Closure + Nav Menu Rework — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Definitively close Ambra's recurring "my profile still says unclaimed / asks me to claim again" report with evidence (not assertion), fix the residual UI that shows claim-flavored prompts to already-claimed users, harden mobile login, and rework the nav menu (add Coaches + Scouts, remove Blog + Events).

**Architecture:** Next.js 15 App Router on Vercel (prod = talkinflag.com), Supabase (project `wxeuybksowhncalrnttl`). Claim state lives on `players` (`is_claimed`, `claim_pending`, `claimed_by`); `src/lib/profile/viewer-state.ts` is the single source of truth for how a profile renders. Nav (desktop + hamburger) renders from one `navLinks` array in `src/components/layout/Nav.tsx`.

**Tech Stack:** TypeScript, Tailwind, Supabase JS (`createAdminClient` service-role for zero-policy tables), vitest (`npm test`), `npx tsc --noEmit`, `npm run build`.

---

## Investigation findings (2026-07-16) — read before executing

Everything server-verifiable was checked TODAY and is **correct**:

| Check | Evidence |
|---|---|
| DB claim state | `players` row `ab5214c7-…` (Ambra): `is_claimed=true`, `claim_pending=false`, `is_approved=true`, `claimed_by=f0c67c19-…` |
| That user is her only account | `auth.users` has exactly one Ambra account: `ambramarcucci1@gmail.com` (Google). The duplicate hotmail account was deleted 2026-07-15 and has NOT reappeared. |
| She can log in | `last_sign_in_at = 2026-07-16 07:18 UTC` — a successful sign-in this morning. |
| Prod is current | Vercel production deployment = latest `main` commit `70ed56c`, state READY (includes the `1d8fc8c` viewer-state fix from 07-15). |
| Live profile page | `curl https://talkinflag.com/players/ab5214c7-…` renders hero badge **"✓ Claimed"**, served `no-store`, **zero** claim CTAs. The 8 "Unclaimed" strings on that page all belong to OTHER players in the similar-players grid at the bottom. |
| Live /players listing | Her serialized card row ships `is_claimed=true, claim_pending=false` → PlayerCard renders "✓ Claimed". |
| Dashboard code path | `src/app/dashboard/page.tsx:57-63` finds her row via service-role `.eq("claimed_by", user.id).eq("is_claimed", true)` → renders the "✓ Claimed" profile card. Claim prompts appear ONLY when signed out or when no row matches. |
| `/join` | Uses the service-role client (`src/lib/supabase.ts` — despite the "anon" name in old docs) and redirects claimed+approved users to /dashboard. |

**What could NOT be verified:** her actual signed-in dashboard render (requires her session/screen) and why login "didn't work" on her second phone.

**Remaining plausible causes (ranked):**
1. **Her report predates the 2026-07-15 fix deploy** — the owner-view claim CTA was genuinely broken until `1d8fc8c` shipped 07-15 08:35 UTC. Both prior "I still see it" confirmations may be pre-deploy.
2. **She isn't signed in on the failing devices.** "Logging in on the other phone didn't work" — Google OAuth is **blocked inside in-app browsers** (Instagram/WhatsApp/Messenger webviews return `403 disallowed_useragent`). A logged-out device also can't render an owner dashboard.
3. **Claim-flavored copy still shown to claimed users** reads as "it's asking me to claim again": the /welcome "Claim your profile" card, the dashboard guided-tour step "Claim and build your profile…", and the 8 "Unclaimed" badges (other players) on her own profile page.

Tasks 2–4 eliminate cause 2 and 3 in code. Task 5 replicates her exact state end-to-end on production so we have **evidence**, not assertion. Task 7 is the owner-communication step that closes cause 1.

---

### Task 1: Nav menu — add Coaches + Scouts, remove Blog + Events

Ambra asked for Coaches and Scouts in the hamburger menu; Daniel wants Blog and Events removed to reduce clutter. One array drives BOTH desktop links and the mobile hamburger, so a single edit covers both. Blog and Events stay reachable via the footer (`Footer.tsx:14` Blog, `:31` Events) — no orphaned pages.

**Files:**
- Modify: `src/components/layout/Nav.tsx:10-17`

**Step 1: Edit the navLinks array**

Replace lines 10–17 of `src/components/layout/Nav.tsx`:

```tsx
const navLinks = [
  { label: "Players", href: "/players" },
  { label: "Teams", href: "/teams" },
  { label: "Coaches", href: "/coaches" },
  { label: "Scouts", href: "/scouts/apply" },
  { label: "Podcast", href: "/podcast" },
  { label: "About", href: "/about" },
];
```

Notes:
- `/coaches` is the coach directory (exists: `src/app/coaches/page.tsx`).
- There is **no** `/scouts` index page — only `/scouts/apply` and `/scouts/submit`. Link to `/scouts/apply`, matching the existing footer convention (`Footer.tsx:41`). Do NOT invent a `/scouts` landing page (YAGNI).
- The active-link highlight uses `pathname === href || pathname.startsWith(href + "/")` — works for `/scouts/apply` and won't double-highlight anything (no other nav link is a prefix of another).

**Step 2: Verify desktop + mobile rendering locally**

Run the dev server (`.claude/launch.json`, port 3000) and check with the browser pane:
- Desktop (1280px): nav shows Players · Teams · Coaches · Scouts · Podcast · About, then Admin?/Dashboard/Join on the right. Six links must not overflow the `gap-8` row at 1024px (`md` breakpoint is where the row appears) — if it wraps or crowds the Join button at 1024px, reduce `gap-8` to `gap-6` on line 72. Check before deciding; don't change it blind.
- Mobile (375px): hamburger opens with the same six links + Sign In/Dashboard + Join.
- Click Coaches → `/coaches` renders; click Scouts → `/scouts/apply` renders; active-state underline appears on the right link.

**Step 3: Commit**

```bash
git add src/components/layout/Nav.tsx
git commit -m "feat(nav): add Coaches + Scouts links, drop Blog + Events (footer keeps both)"
```

---

### Task 2: In-app-browser login warning (root cause for "login didn't work on the other phone")

Google blocks OAuth inside webviews (Instagram, Facebook, Messenger, WhatsApp, LINE, TikTok). Ambra opens the site from a chat/social link → taps "Continue with Google" → gets a Google error or a silent dead end. The magic-link path works everywhere (the emailed link opens in the real default browser). Detect webview UAs and (a) steer the user to magic link, (b) explain how to open in a real browser.

**Files:**
- Create: `src/lib/in-app-browser.ts`
- Test: `src/lib/in-app-browser.test.ts`
- Modify: `src/app/auth/login/LoginForm.tsx`

**Step 1: Write the failing test**

`src/lib/in-app-browser.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { isInAppBrowser } from "./in-app-browser";

describe("isInAppBrowser", () => {
  it("detects Instagram iOS webview", () => {
    expect(
      isInAppBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21F90 Instagram 334.0.0.27.94"
      )
    ).toBe(true);
  });

  it("detects Facebook / Messenger webview", () => {
    expect(isInAppBrowser("Mozilla/5.0 (iPhone; ...) [FBAN/FBIOS;FBAV/…]")).toBe(true);
    expect(isInAppBrowser("Mozilla/5.0 (Linux; Android 14; …) FB_IAB/FB4A;FBAV/…")).toBe(true);
  });

  it("detects WhatsApp, LINE, TikTok webviews", () => {
    expect(isInAppBrowser("Mozilla/5.0 (iPhone; …) WhatsApp/23.20.79")).toBe(true);
    expect(isInAppBrowser("Mozilla/5.0 (iPhone; …) Line/13.19.0")).toBe(true);
    expect(isInAppBrowser("Mozilla/5.0 (Linux; Android 14; …) musical_ly_2022803030 …")).toBe(true);
  });

  it("does NOT flag real Safari, Chrome, Firefox", () => {
    expect(
      isInAppBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
      )
    ).toBe(false);
    expect(
      isInAppBrowser(
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36"
      )
    ).toBe(false);
  });

  it("returns false for empty/undefined", () => {
    expect(isInAppBrowser("")).toBe(false);
    expect(isInAppBrowser(undefined)).toBe(false);
  });
});
```

**Step 2: Run it to make sure it fails**

Run: `npm test -- in-app-browser`
Expected: FAIL — module `./in-app-browser` not found.

**Step 3: Implement**

`src/lib/in-app-browser.ts`:

```ts
/** UA detection for embedded webviews where Google OAuth is blocked
 *  (403 disallowed_useragent). Used to steer users to magic-link sign-in. */
const IN_APP_UA =
  /\b(Instagram|FBAN|FBAV|FB_IAB|Messenger|WhatsApp|Line\/|MicroMessenger|musical_ly|TikTok|Snapchat)\b/i;

export function isInAppBrowser(userAgent: string | undefined): boolean {
  if (!userAgent) return false;
  return IN_APP_UA.test(userAgent);
}
```

**Step 4: Run tests**

Run: `npm test -- in-app-browser`
Expected: PASS (all 5).

**Step 5: Wire into LoginForm**

`src/app/auth/login/LoginForm.tsx` — add state + effect near the other `useState` calls (it's already a `"use client"` component):

```tsx
import { isInAppBrowser } from "@/lib/in-app-browser";
// …
const [inAppBrowser, setInAppBrowser] = useState(false);
useEffect(() => {
  setInAppBrowser(isInAppBrowser(navigator.userAgent));
}, []);
```

(Detect in `useEffect`, not during render, to avoid a hydration mismatch — the server always renders the banner absent.) Add `useEffect` to the existing react import.

Render a notice ABOVE the Google button (inside the main card, before the `{/* Google OAuth */}` block):

```tsx
{inAppBrowser && (
  <div className="bg-brand-yellow/10 border border-brand-yellow/30 text-brand-yellow text-xs px-4 py-3 leading-relaxed">
    <p className="font-display uppercase tracking-widest mb-1">Heads up</p>
    <p className="text-brand-yellow/80">
      You&apos;re inside an app&apos;s built-in browser (Instagram, WhatsApp, etc.), where
      Google sign-in is blocked by Google. Use the <strong>email magic link</strong> below —
      or tap the ⋯ menu and choose &ldquo;Open in Browser&rdquo; first.
    </p>
  </div>
)}
```

Do NOT disable the Google button (a false-positive UA match must never lock anyone out) — the banner only informs.

**Step 6: Verify in browser**

Dev server + browser pane: override UA is fiddly in the pane, so verify via `javascript_tool` is NOT appropriate for implementing — instead temporarily assert by unit test coverage (done) plus one manual check that the login page still renders unchanged with a normal UA (no banner, Google + magic link both present, no layout shift).

**Step 7: Commit**

```bash
git add src/lib/in-app-browser.ts src/lib/in-app-browser.test.ts src/app/auth/login/LoginForm.tsx
git commit -m "fix(auth): warn in-app-browser users that Google OAuth is blocked, steer to magic link"
```

---

### Task 3: /welcome — stop telling already-claimed users to claim

`src/app/welcome/page.tsx:16` shows a static "Claim your profile" card to every member, including someone whose profile is already claimed. Make it state-aware. The page is already a server component doing `auth.getUser()`.

**Files:**
- Modify: `src/app/welcome/page.tsx`

**Step 1: Query claim state and swap the card**

In `WelcomePage()`, after the `user` check, reuse the existing shared helper (DRY — `src/lib/claims.ts:6`):

```tsx
import { createAdminClient } from "@/lib/eval/admin-client";
import { hasClaimedProfile } from "@/lib/claims";
// …
const claimed = !admin && (await hasClaimedProfile(createAdminClient(), user.id));

const memberFeatures = [
  claimed
    ? { title: "Your profile is claimed ✓", body: "You own your player card. Keep stats, highlights, and photos fresh from your dashboard." }
    : { title: "Claim your profile", body: "Find your player card and make it yours — coaches and scouts search the database every week." },
  …(keep the other two MEMBER_FEATURES entries unchanged)…
];
const features = admin ? ADMIN_FEATURES : memberFeatures;
```

(`players` is a zero-policy RLS table — the cookie client can't read it; service-role client is the established pattern per the usage-guard rules. `hasClaimedProfile` takes any `SupabaseClient`.)

**Step 2: Run the guard test**

Run: `npm test -- usage-guard`
Expected: PASS — confirms the new query obeys the cookie-vs-service-role rules.

**Step 3: Verify**

Dev server: sign in as a claimed local test user if one exists, else rely on Task 5's prod E2E to cover this page. At minimum verify signed-out redirect and admin variant still render (`/welcome` as admin shows ADMIN_FEATURES unchanged).

**Step 4: Commit**

```bash
git add src/app/welcome/page.tsx
git commit -m "fix(welcome): claim card is state-aware — claimed users no longer told to claim"
```

---

### Task 4: Dashboard guided-tour copy — remove "Claim" phrasing

`src/components/onboarding/steps.ts` member tour step 2 says "Claim and build your profile…" — shown even when the profile card right under it says "✓ Claimed". State-neutral copy fixes the contradiction with zero logic risk.

**Files:**
- Modify: `src/components/onboarding/steps.ts`

**Step 1: Edit the copy**

```ts
  {
    target: '[data-tour="profile"]',
    title: "Your Player Profile",
    body: "Build out your profile so coaches, scouts, and fans can find you. The completion bar shows what's left to add.",
  },
```

**Step 2: Commit**

```bash
git add src/components/onboarding/steps.ts
git commit -m "fix(onboarding): tour copy no longer says 'claim' to already-claimed users"
```

---

### Task 5: End-to-end PROOF on production — replicate Ambra's exact state with a disposable identity

We have never watched a real signed-in claimed user's dashboard render in production — every prior "fixed" claim was code-reading + logged-out curl. This task produces that evidence. Run it AFTER Tasks 1–4 are deployed (it validates the final state).

**Files:**
- Create: `scripts/e2e-claim-check.ts` (setup/teardown helper; kept in repo for reuse)

**Step 1: Write the setup script**

`scripts/e2e-claim-check.ts` (run with `npx tsx scripts/e2e-claim-check.ts setup|teardown`; reads `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` from `.env.local` like the other scripts in `scripts/`):

```ts
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const TEST_EMAIL = "e2e-claim-check@talkinflag.com";

async function setup() {
  const { data: created, error: uErr } = await db.auth.admin.createUser({
    email: TEST_EMAIL,
    email_confirm: true,
  });
  if (uErr) throw uErr;
  const userId = created.user.id;

  const { data: player, error: pErr } = await db
    .from("players")
    .insert({
      first_name: "TF-E2E",
      last_name: "ClaimCheck",
      position: "WR",
      level: "college",
      is_approved: false, // keep out of public listings; dashboard query doesn't filter on it (dashboard/page.tsx:57-63)
      is_claimed: true,
      claim_pending: false,
      claimed_by: userId,
      claimed_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (pErr) throw pErr;

  const { data: link, error: lErr } = await db.auth.admin.generateLink({
    type: "magiclink",
    email: TEST_EMAIL,
    options: { redirectTo: "https://talkinflag.com/auth/callback?next=/dashboard" },
  });
  if (lErr) throw lErr;
  console.log("player:", player.id);
  console.log("magic link:", link.properties.action_link);
}

async function teardown() {
  const { data: player } = await db.from("players").select("id, claimed_by").eq("last_name", "ClaimCheck").eq("first_name", "TF-E2E").maybeSingle();
  if (player) {
    await db.from("claim_events").delete().eq("player_id", player.id);
    await db.from("players").delete().eq("id", player.id);
    if (player.claimed_by) await db.auth.admin.deleteUser(player.claimed_by);
    console.log("cleaned up", player.id);
  } else {
    console.log("nothing to clean");
  }
}

const cmd = process.argv[2];
if (cmd === "setup") setup();
else if (cmd === "teardown") teardown();
else console.log("usage: tsx scripts/e2e-claim-check.ts setup|teardown");
```

Before relying on `is_approved: false`, grep `src/app/dashboard/page.tsx` and confirm the player query has no `is_approved` filter (it doesn't as of `70ed56c`; re-verify at execution time). If the players table has other NOT NULL columns the insert misses, the insert error will name them — add minimal values and re-run.

**Step 2: Run setup + browser walk-through on production**

```bash
npx tsx scripts/e2e-claim-check.ts setup
```

Open the printed magic link in the browser pane, then verify and **screenshot each**:
1. Lands signed in → `/dashboard` shows the profile card titled "Your Profile" with the **"✓ Claimed"** badge and "TF-E2E ClaimCheck".
2. Checklist first item reads "Your player profile" (done) — NOT "Find & claim your player profile".
3. No banner, card, or checklist item anywhere on the dashboard invites claiming.
4. `/welcome` shows "Your profile is claimed ✓" card (Task 3 live).
5. `/auth/claim/<player-id>` → redirects straight to `/dashboard` (already-claimed-by-you path).

Expected: all 5 pass. If ANY fails, we have finally reproduced Ambra's bug in a controlled session — STOP, capture the screenshot + network/console output, and debug that specific render path before touching anything else. That failure artifact is the real deliverable.

**Step 3: Teardown**

```bash
npx tsx scripts/e2e-claim-check.ts teardown
```

Then confirm cleanup: the SQL `select count(*) from players where last_name='ClaimCheck'` returns 0 and the auth user is gone.

**Step 4: Commit the script**

```bash
git add scripts/e2e-claim-check.ts
git commit -m "test: repeatable E2E claimed-dashboard verification script (setup/teardown)"
```

**Risk callout:** this creates a real (unapproved, obviously-named) player row and auth user on production for ~minutes. `is_approved: false` keeps it off public listings; teardown removes everything including `claim_events`. Accepted and reversible.

---

### Task 6: Full-suite verification + deploy

**Step 1: Static + tests + build**

```bash
npx tsc --noEmit        # expected: clean
npm test                # expected: all suites pass (150+ incl. new in-app-browser tests, usage-guard, viewer-state, admin-gating)
npm run build           # expected: green
```

**Step 2: Push and confirm deploy**

```bash
git push origin main
```

Per standing preference (memory: no deploy polling): don't poll — but Task 5 requires the deploy to be live, so check ONCE after a reasonable interval that the latest Vercel production deployment is READY on the new SHA before running Task 5.

**Step 3: Live smoke checks (logged-out)**

- `curl -s https://talkinflag.com | grep -o 'Coaches\|Scouts\|>Blog<\|>Events<'` → nav shows Coaches/Scouts; Blog/Events only in footer.
- Browser pane at 375px: hamburger opens, six links present, Coaches/Scouts navigate correctly.
- `curl -s https://talkinflag.com/players/ab5214c7-17bf-4f63-ab38-6a6ebe1c9d2c | grep -c "Is this you"` → 0, and hero still shows "✓ Claimed".

**Step 4: Second review pass**

Re-read the full diff (`git diff HEAD~5`) as an adversary:
- Nav: no key collisions, aria attributes intact, active-state logic unaffected.
- LoginForm: banner cannot block either sign-in path; no hydration mismatch (banner is client-effect-gated).
- Welcome: admin path unchanged; no cookie-client read of a zero-policy table (usage-guard test enforces).
- E2E script: teardown deletes everything it created; service key never printed.

---

### Task 7: Owner communication (Daniel → Ambra) — evidence-based closure

Not a code task. Draft a short message for Daniel to send:

1. State plainly: her profile in the database is claimed by her `ambramarcucci1@gmail.com` account, the live page shows "✓ Claimed", and we replicated her exact account state end-to-end on 2026-07-16 with screenshots (attach Task 5 screenshots).
2. The known real bug (her own profile offering "Claim Profile" to her) was fixed in the 2026-07-15 release — any test before then would still have shown it.
3. If she still sees a claim prompt after this release: send a screenshot **that includes the top of the dashboard** — the email address shown under the "Dashboard" heading tells us instantly whether she's on the right account — plus which app/browser she opened the site from.
4. Google sign-in does not work inside Instagram/WhatsApp's built-in browser (Google blocks it) — the site now detects that and says so; the email magic link always works.

---

## Output summary requirements (for the executing session's final report)

Report exactly: (1) root cause(s) with the evidence table above, explicitly separating *verified-correct* from *unverified* (her live session remains unverifiable until Task 5 screenshots or her new screenshot); (2) files changed; (3) what each change fixes; (4) verification performed (which tests ran and what they prove, the live curl/browser checks, the Task 5 walkthrough screenshots); (5) remaining risks: UA-sniffing false positives (mitigated: informational banner only), test data on prod (mitigated: teardown + verified-empty check), and the honest statement that if Ambra STILL reports the issue after this ships, the next step is her annotated screenshot — not another blind code change.
