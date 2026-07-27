# Player Review Workflow & Lifecycle Emails — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the ambiguous, delete-only player review flow with a single clear review pipeline — signup → pending → approve **or** deny-with-reason-and-fix → resubmit — backed by consolidated, encouraging, on-brand lifecycle emails.

**Architecture:** Add a `review_status` state machine (+ denial-reason columns) to `players` as the single source of truth for the admin review of a self-registration, keeping `is_approved` as the existing "publicly live" gate. Consolidate every lifecycle email into one tested `src/lib/emails/lifecycle.ts` module (pure HTML builders). A unified admin Pending queue lets an admin Approve or Deny (preset reason + what-to-fix + optional note); denial soft-hides the profile and sends a fan-retaining email instead of hard-deleting. A denied athlete sees the reason on their dashboard and can fix + resubmit back into the queue.

**Tech Stack:** Next.js 15 App Router · TypeScript · Supabase (service-role admin client) · Resend · Vitest.

---

## Analysis — Current State (read before building)

Traced during planning; cite these when in doubt.

### The two "approved" concepts (root of Ambra's confusion)
| Concept | Column | Set where | Public effect |
|---|---|---|---|
| Profile reviewed & publicly live | `players.is_approved` | `approvePlayer` (`src/app/admin/players/actions.ts:104`), scraped/admin inserts default it **true** | Gates visibility on ~30 read sites |
| Self-service claim awaiting approval | `players.claim_pending` | `approveClaim` clears it (`actions.ts:185`); claim route sets it (`src/app/api/players/[id]/claim/route.ts:41`) | Hides "✓ Claimed" badge + blocks owner editing; profile stays live |

### The "nudge auto-approves" report is NOT a bug
- **No DB triggers** exist on any `public` table (verified live).
- `sendNudge` (`src/app/admin/members/actions.ts:30`) writes only to `profile_nudges` + reads the auth user. It mutates **no** `players` column.
- The player in question (Aleena Ouellette, `b08b341a…`) has been `is_approved=true` since her row was **scraped on 2026-06-25**, a month before the **2026-07-23** nudge. Her only `claim_events` row is a **2026-07-24** self-claim ("pending review"). The approval predates the nudge; nothing flipped.
- **Real cause:** scraped profiles are born `is_approved=true` (publicly live), and nothing in the admin UI labels "imported, never human-reviewed" differently from "human-approved." Nudging one and seeing it live reads as "the nudge approved it."

### Workflow gaps this plan closes
1. **Denial = destruction.** `PendingReviewActions` "Reject" calls `deletePlayer` (hard delete, `actions.ts:138`) — no reason, no email, no recovery. Same for scouts (`/api/scouts/approve`).
2. **No "what to fix" / resubmit loop.** A denied athlete is simply gone.
3. **Emails are scattered & inconsistent.** Lifecycle copy is inlined across `submit/route.ts`, `players/actions.ts`, `claim/route.ts`, `nudge.ts` — three different visual templates, no denial email at all.
4. **Members table can't distinguish review states** — only shows `claim_pending` as a generic "Pending" and `is_verified`; a self-registered unapproved profile shows no indicator.

### Owner decisions (defaults chosen; change in review if desired)
- **D1 — Denied profile visibility:** *Default:* denial sets `is_approved=false` (soft-hides from public) but keeps the row (recoverable). *Alt:* keep scraped denials live. → We hide self-registrations; scraped profiles are never "denied," only reviewed.
- **D2 — Denial email tone/CTA:** *Default copy below* keeps them a fan (podcast + rankings links, "you're still on the team") and gives a one-click resubmit. Copy is owner-editable in `lifecycle.ts`.

---

## Task 1: Regression guard — prove `sendNudge` never mutates a player

Locks in the root-cause finding so a future refactor can't silently couple nudging to approval.

**Files:**
- Test: `src/app/admin/members/nudge-isolation.test.ts` (create)

**Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Guard: the nudge server action must only touch profile_nudges + auth,
// never the players table. See docs/plans/2026-07-27-*.md Analysis.
describe("sendNudge isolation", () => {
  const src = readFileSync(join(__dirname, "actions.ts"), "utf8");
  const sendNudge = src.slice(src.indexOf("export async function sendNudge"));

  it("does not write to the players table", () => {
    expect(sendNudge).not.toMatch(/from\(["']players["']\)/);
    expect(sendNudge).not.toMatch(/is_approved/);
    expect(sendNudge).not.toMatch(/claim_pending/);
  });
});
```

**Step 2: Run — expect PASS immediately** (documents current-correct behavior)

Run: `npx vitest run src/app/admin/members/nudge-isolation.test.ts`
Expected: PASS. If it FAILS, someone coupled nudge→players — stop and investigate.

**Step 3: Commit**

```bash
git add src/app/admin/members/nudge-isolation.test.ts
git commit -m "test: guard that sendNudge never mutates player review state"
```

---

## Task 2: Migration — review_status state machine + denial columns

**Files:**
- Create: `supabase/migrations/019_player_review_status.sql`

**Step 1: Write the migration**

```sql
-- 019_player_review_status.sql
-- Single source of truth for the ADMIN REVIEW of a self-registered profile.
-- is_approved stays the public-visibility gate; review_status drives the queue.
--   'pending'    self-registered, awaiting a human decision (is_approved=false)
--   'approved'   a human approved it (is_approved=true)
--   'denied'     a human denied it with a reason (is_approved=false, recoverable)
--   'unreviewed' imported/scraped, publicly live but never human-checked
alter table public.players
  add column if not exists review_status text not null default 'unreviewed'
    check (review_status in ('pending','approved','denied','unreviewed')),
  add column if not exists denial_reason text,   -- preset key, e.g. 'highlight_broken'
  add column if not exists denial_note   text,   -- optional free-text from admin
  add column if not exists denial_fix    text,   -- rendered "what to fix" shown to athlete
  add column if not exists denied_at     timestamptz,
  add column if not exists reviewed_by   uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_at   timestamptz;

-- Backfill so existing rows map cleanly onto the new machine.
update public.players set review_status = 'approved'
  where is_approved = true and (is_claimed = true or is_verified = true);
update public.players set review_status = 'pending'
  where is_approved = false;
-- everything else (scraped, live, unclaimed) stays 'unreviewed'

create index if not exists players_review_status_idx on public.players(review_status);
```

**Step 2: Apply live**

Use the Supabase MCP `apply_migration` (project `wxeuybksowhncalrnttl`, name `019_player_review_status`). Then verify:

Run this via MCP `execute_sql`:
```sql
select review_status, count(*) from players group by review_status order by 1;
```
Expected: rows for `approved` / `pending` / `unreviewed` (no `denied` yet).

**Step 3: Commit**

```bash
git add supabase/migrations/019_player_review_status.sql
git commit -m "feat: add review_status state machine + denial columns to players"
```

---

## Task 3: Denial presets + review state-transition helper (pure, TDD)

The tone-controlled reason presets and the state transitions live in one tested pure module. **REQUIRED SUB-SKILL:** @superpowers:test-driven-development.

**Files:**
- Create: `src/lib/review/denial-presets.ts`
- Create: `src/lib/review/transitions.ts`
- Test: `src/lib/review/transitions.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { DENIAL_PRESETS, isDenialPreset } from "./denial-presets";
import { approveUpdate, denyUpdate, resubmitUpdate } from "./transitions";

describe("denial presets", () => {
  it("every preset has an encouraging reason + concrete fix", () => {
    for (const p of Object.values(DENIAL_PRESETS)) {
      expect(p.reason.length).toBeGreaterThan(10);
      expect(p.fix.length).toBeGreaterThan(10);
      // fan-retaining tone: no harsh words
      expect(p.reason.toLowerCase()).not.toMatch(/reject|denied|failed|invalid/);
    }
  });
  it("validates preset keys", () => {
    expect(isDenialPreset("highlight_broken")).toBe(true);
    expect(isDenialPreset("nope")).toBe(false);
  });
});

describe("review transitions", () => {
  it("approve sets approved + publicly live", () => {
    expect(approveUpdate("admin-1")).toMatchObject({
      review_status: "approved", is_approved: true, denial_reason: null,
    });
  });
  it("deny stores reason/fix, hides publicly, is recoverable", () => {
    const u = denyUpdate("admin-1", "highlight_broken", "extra note");
    expect(u.review_status).toBe("denied");
    expect(u.is_approved).toBe(false);
    expect(u.denial_reason).toBe("highlight_broken");
    expect(u.denial_note).toBe("extra note");
    expect(u.denial_fix).toContain("highlight"); // rendered from preset
  });
  it("resubmit returns a denied profile to pending and clears denial", () => {
    expect(resubmitUpdate()).toMatchObject({
      review_status: "pending", denial_reason: null, denied_at: null,
    });
  });
});
```

**Step 2: Run — expect FAIL** (`Cannot find module './denial-presets'`)

Run: `npx vitest run src/lib/review/transitions.test.ts`

**Step 3: Implement `denial-presets.ts`**

```typescript
export interface DenialPreset { label: string; reason: string; fix: string; }

// Tone rule: affirm first, direct next, never "rejected/failed". Owner-editable.
export const DENIAL_PRESETS: Record<string, DenialPreset> = {
  highlight_broken: {
    label: "Highlight link doesn't work",
    reason: "We couldn't open your highlight link, so we can't show your game off yet.",
    fix: "Add a working YouTube or Hudl link to real game or combine footage, then resubmit.",
  },
  incomplete_info: {
    label: "Profile needs a little more",
    reason: "A couple of key details are missing, so your profile isn't ready to shine yet.",
    fix: "Fill in your position, level, and team/school so coaches and scouts can find you.",
  },
  photo_needed: {
    label: "Needs a clear photo",
    reason: "Your profile doesn't have a clear photo of you yet.",
    fix: "Add a clear headshot or action shot — it's the first thing scouts look for.",
  },
  cant_verify: {
    label: "Couldn't verify it's you",
    reason: "We want to make sure every profile belongs to the right athlete before it goes live.",
    fix: "Reply to this email from the address on your roster, or add your verified social handle, and resubmit.",
  },
  possible_duplicate: {
    label: "Possible duplicate",
    reason: "It looks like there may already be a profile for you on Talkin Flag.",
    fix: "Search your name on talkinflag.com and claim your existing profile — reach out if you can't find it.",
  },
};

export function isDenialPreset(key: string): key is keyof typeof DENIAL_PRESETS {
  return Object.prototype.hasOwnProperty.call(DENIAL_PRESETS, key);
}
```

**Step 4: Implement `transitions.ts`**

```typescript
import { DENIAL_PRESETS } from "./denial-presets";

export function approveUpdate(adminId: string) {
  return {
    review_status: "approved" as const, is_approved: true,
    reviewed_by: adminId, reviewed_at: new Date().toISOString(),
    denial_reason: null, denial_note: null, denial_fix: null, denied_at: null,
  };
}

export function denyUpdate(adminId: string, presetKey: keyof typeof DENIAL_PRESETS, note?: string) {
  const preset = DENIAL_PRESETS[presetKey];
  return {
    review_status: "denied" as const, is_approved: false,
    reviewed_by: adminId, reviewed_at: new Date().toISOString(),
    denial_reason: presetKey, denial_note: note?.trim() || null,
    denial_fix: preset.fix, denied_at: new Date().toISOString(),
  };
}

export function resubmitUpdate() {
  return {
    review_status: "pending" as const,
    denial_reason: null, denial_note: null, denial_fix: null, denied_at: null,
  };
}
```

**Step 5: Run — expect PASS**

Run: `npx vitest run src/lib/review/transitions.test.ts`

**Step 6: Commit**

```bash
git add src/lib/review/
git commit -m "feat: denial presets + review state-transition helpers (pure, tested)"
```

---

## Task 4: Consolidated lifecycle email builders (pure, TDD)

One module, one visual template (reuse `confirmationEmailHtml` from `src/lib/email.ts`), every lifecycle message — including the new denial email.

**Files:**
- Create: `src/lib/emails/lifecycle.ts`
- Test: `src/lib/emails/lifecycle.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import {
  pendingReceivedEmail, approvedLiveEmail, claimApprovedEmail, deniedEmail,
} from "./lifecycle";

describe("lifecycle emails", () => {
  it("pending-received names the athlete and sets expectation", () => {
    const e = pendingReceivedEmail("Maya");
    expect(e.subject).toMatch(/pending|review/i);
    expect(e.html).toContain("Maya");
  });
  it("approved-live links to the dashboard", () => {
    expect(approvedLiveEmail("Maya").html).toContain("talkinflag.com/dashboard");
  });
  it("denied email is encouraging: reason + fix + resubmit + still-a-fan", () => {
    const e = deniedEmail("Maya", "highlight_broken", "loved your energy");
    expect(e.html).toContain("Maya");
    expect(e.html.toLowerCase()).toContain("highlight"); // the fix
    expect(e.html).toMatch(/dashboard\/edit|resubmit/i);   // clear next step
    expect(e.html.toLowerCase()).not.toMatch(/rejected|denied|failed/); // tone
    expect(e.html).toContain("loved your energy"); // admin note surfaced
    expect(e.subject.toLowerCase()).not.toMatch(/rejected|denied/);
  });
});
```

**Step 2: Run — expect FAIL**

Run: `npx vitest run src/lib/emails/lifecycle.test.ts`

**Step 3: Implement `lifecycle.ts`** (reuses the branded wrapper; denial copy keeps them on the team)

```typescript
import { confirmationEmailHtml } from "@/lib/email";
import { DENIAL_PRESETS, isDenialPreset } from "@/lib/review/denial-presets";

export interface LifecycleEmail { subject: string; html: string; }

export function pendingReceivedEmail(firstName: string): LifecycleEmail {
  return {
    subject: "Your Talkin Flag profile is in review 🏈",
    html: confirmationEmailHtml({
      heading: "Profile received!",
      body: `Thanks ${firstName} — you're in the queue. An admin reviews every profile so the ` +
        `TF community stays real. We'll email you the moment yours is live.`,
    }),
  };
}

export function approvedLiveEmail(firstName: string): LifecycleEmail {
  return {
    subject: "You're live on Talkin Flag ✅",
    html: confirmationEmailHtml({
      heading: `You're live, ${firstName}!`,
      body: `Your profile is approved and visible to coaches, scouts, and national-team selectors.<br/><br/>` +
        `<a href="https://talkinflag.com/dashboard" style="color:#FDDD58;font-weight:bold;">Open your dashboard →</a>`,
    }),
  };
}

export function claimApprovedEmail(firstName: string): LifecycleEmail {
  return {
    subject: "Your profile claim is approved ✓",
    html: confirmationEmailHtml({
      heading: "Claim approved ✓",
      body: `Hi ${firstName}, your claim is verified. You can now edit your profile, add highlights, ` +
        `and submit stats for verification.<br/><br/>` +
        `<a href="https://talkinflag.com/dashboard" style="color:#FDDD58;font-weight:bold;">Go to dashboard →</a>`,
    }),
  };
}

// Fan-retaining denial: affirm, one specific fix, one-click resubmit, stay in the community.
export function deniedEmail(firstName: string, presetKey: string, note?: string): LifecycleEmail {
  const preset = isDenialPreset(presetKey) ? DENIAL_PRESETS[presetKey] : null;
  const reason = preset?.reason ?? "Your profile needs one small tweak before it goes live.";
  const fix = preset?.fix ?? "Update your details and resubmit.";
  const noteHtml = note?.trim()
    ? `<br/><br/><em style="color:#ffffff99;">A note from our team: ${note.trim()}</em>` : "";
  return {
    subject: "One quick step before your profile goes live",
    html: confirmationEmailHtml({
      heading: `Almost there, ${firstName} 🏈`,
      body:
        `You're part of the Talkin Flag community — we just need one thing before your profile goes live.<br/><br/>` +
        `<strong>What happened:</strong> ${reason}<br/>` +
        `<strong>How to fix it:</strong> ${fix}${noteHtml}<br/><br/>` +
        `<a href="https://talkinflag.com/dashboard/edit" style="color:#FDDD58;font-weight:bold;">Update &amp; resubmit →</a>` +
        `<br/><br/>Meanwhile, catch the pod and the latest TF Rankings at ` +
        `<a href="https://talkinflag.com/podcast" style="color:#FDDD58;">talkinflag.com</a>. We're rooting for you.`,
    }),
  };
}
```

**Step 4: Run — expect PASS**

Run: `npx vitest run src/lib/emails/lifecycle.test.ts`

**Step 5: Commit**

```bash
git add src/lib/emails/
git commit -m "feat: consolidated lifecycle email builders incl. encouraging denial email"
```

---

## Task 5: Wire approve/deny into server actions + resubmit endpoint

Rewire `approvePlayer` to use the transition + new email; add `denyPlayer`; keep `deletePlayer` only for true spam; add resubmit.

**Files:**
- Modify: `src/app/admin/players/actions.ts` (approvePlayer ~104; add denyPlayer)
- Modify: `src/app/admin/players/actions.ts` approveClaim (~185) → use `claimApprovedEmail`
- Modify: `src/app/api/players/submit/route.ts:157` → use `pendingReceivedEmail`, and set `review_status:'pending'` on insert (already `is_approved:false`)
- Create: `src/app/api/players/[id]/resubmit/route.ts`
- Test: `src/app/admin/players/deny.test.ts` (asserts denyPlayer builds the denied update + calls email — via a thin extractable helper if needed)

**Step 1: Update `approvePlayer`** — replace the inline `update({ is_approved: true })` and inline HTML with:

```typescript
import { approveUpdate, denyUpdate } from "@/lib/review/transitions";
import { isDenialPreset } from "@/lib/review/denial-presets";
import { approvedLiveEmail, deniedEmail } from "@/lib/emails/lifecycle";

export async function approvePlayer(id: string) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Not authorized");
  const db = createServerClient();
  const { data: player, error } = await db
    .from("players").update(approveUpdate(admin.id)).eq("id", id)
    .select("first_name, claimed_by").single();
  if (error) throw new Error(error.message);
  if (player?.claimed_by) {
    const { data: u } = await db.auth.admin.getUserById(player.claimed_by);
    if (u?.user?.email) {
      const e = approvedLiveEmail(player.first_name);
      await sendEmail({ to: u.user.email, subject: e.subject, html: e.html });
    }
  }
  revalidatePath("/admin/players"); revalidatePath("/players");
}
```

**Step 2: Add `denyPlayer`**

```typescript
export async function denyPlayer(id: string, presetKey: string, note?: string) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Not authorized");
  if (!isDenialPreset(presetKey)) throw new Error("Pick a denial reason.");
  const db = createServerClient();
  const { data: player, error } = await db
    .from("players").update(denyUpdate(admin.id, presetKey, note)).eq("id", id)
    .select("first_name, claimed_by").single();
  if (error) throw new Error(error.message);
  if (player?.claimed_by) {
    const { data: u } = await db.auth.admin.getUserById(player.claimed_by);
    if (u?.user?.email) {
      const e = deniedEmail(player.first_name, presetKey, note);
      await sendEmail({ to: u.user.email, subject: e.subject, html: e.html });
    }
  }
  revalidatePath("/admin/players"); revalidatePath("/players");
}
```

**Step 3:** Point `approveClaim`'s inline email at `claimApprovedEmail(player.first_name)`; point `submit/route.ts` confirmation at `pendingReceivedEmail(created.first_name)` and add `review_status: "pending"` to its insert payload.

**Step 4: Create resubmit route** (`src/app/api/players/[id]/resubmit/route.ts`) — auth user must own the profile (`claimed_by = user.id`) and it must be `review_status='denied'`; apply `resubmitUpdate()`, `notifyAdmins(...)`, revalidate.

**Step 5:** `npx tsc --noEmit` clean; run existing player/action tests.

Run: `npx vitest run src/app/admin src/app/api`

**Step 6: Commit**

```bash
git add src/app/admin/players/actions.ts src/app/api/players/submit/route.ts src/app/api/players/[id]/resubmit
git commit -m "feat: approve/deny-with-reason actions + resubmit route on lifecycle emails"
```

---

## Task 6: Admin UI — Deny-with-reason on the Pending queue

Replace the destructive "Reject" with **Deny** (preset dropdown + optional note) and keep a separate, clearly-labeled "Delete (spam)".

**Files:**
- Modify: `src/app/admin/players/PendingReviewActions.tsx`
- Modify: `src/app/admin/players/page.tsx` (Pending list already `is_approved=false`; also surface a **Denied** filter using `review_status='denied'`, and show the stored reason on each denied row)

**Steps:**
1. In `PendingReviewActions`, replace the reject button with a Deny control: a `<select>` of `DENIAL_PRESETS` (label) + optional note `<input>` + confirm → `denyPlayer(playerId, presetKey, note)`. Keep a subdued "Delete (spam)" that still calls `deletePlayer` behind a confirm.
2. In `page.tsx`, add a `denied` tab (`review_status='denied'`) that lists denied profiles with their `denial_reason` label + `denied_at`, each with an "Approve" (re-approve) button.
3. Manual verify in preview (`.claude/launch.json`, port 3000): sign in as admin → `/admin/players?filter=pending` → Deny a test row with a preset → row moves to Denied tab, reason shows; check Vercel/Resend log line for the denial email.

**Commit:**
```bash
git add src/app/admin/players/PendingReviewActions.tsx src/app/admin/players/page.tsx
git commit -m "feat: admin deny-with-reason UI + denied queue (no more silent delete)"
```

---

## Task 7: Members table — unambiguous review status chip

Kill the "scraped looks approved" trap Ambra hit.

**Files:**
- Modify: `src/app/admin/members/page.tsx` (select `review_status`; pass through)
- Modify: `src/app/admin/members/MembersTable.tsx` (`ProfileCell`)

**Steps:**
1. Add `review_status` to the players select and to `MemberRow`.
2. In `ProfileCell`, render a status chip: `pending` → "Awaiting review", `denied` → "Denied · <reason>", `unreviewed` → "Imported (not reviewed)", `approved` → "Live ✓". Keep the existing `claim_pending` → "Claim pending" chip **separately** so claim vs review never conflate.
3. Manual verify: Aleena's row now reads "Live ✓" + "Claim pending" — obviously two different things.

**Commit:**
```bash
git add src/app/admin/members/page.tsx src/app/admin/members/MembersTable.tsx
git commit -m "feat: explicit review-status chip in Members (review vs claim disambiguated)"
```

---

## Task 8: Athlete-facing — show denial reason + resubmit on the dashboard

Close the loop so a denied athlete self-corrects instead of churning.

**Files:**
- Modify: `src/app/dashboard/page.tsx` (or the dashboard status card component it renders)

**Steps:**
1. When the viewer's player row is `review_status='denied'`, render a card: "One step before you're live" + the `denial_fix` + admin `denial_note` + an "Update & resubmit" button hitting `/api/players/[id]/resubmit` after they save edits.
2. When `review_status='pending'`, show a calm "In review" banner (no action needed).
3. Manual verify with the disposable E2E identity (`scripts/e2e-claim-check.ts` pattern): deny that profile in admin → load dashboard → reason + resubmit visible → resubmit → row returns to `pending`, admin notified.

**Commit:**
```bash
git add src/app/dashboard
git commit -m "feat: denied athletes see the reason + one-click resubmit on their dashboard"
```

---

## Task 9: Full verification + docs

**Steps:**
1. `npx tsc --noEmit` — clean.
2. `npm run test` — all green (new + existing).
3. `npm run build` — green.
4. Preview E2E of the happy + denial + resubmit paths (screenshots for the owner update).
5. Append a short "Player review workflow" section to `CLAUDE.md` (the state machine + which email fires when) and draft an owner note for Ambra at `docs/ambra-update-2026-07-27-review-workflow.md` explaining: the nudge never approved anything (evidence), and the new deny-with-reason + resubmit flow.

**Commit:**
```bash
git add CLAUDE.md docs/ambra-update-2026-07-27-review-workflow.md
git commit -m "docs: document player review state machine + lifecycle emails"
```

---

## Email sequence — after this plan (reference)

| Trigger | Email | Builder |
|---|---|---|
| Self-registration submitted | "In review 🏈" | `pendingReceivedEmail` |
| Admin approves registration | "You're live ✅" | `approvedLiveEmail` |
| Admin denies registration | "One quick step…" (reason + fix + resubmit) | `deniedEmail` |
| Athlete resubmits | admin notify (`notifyAdmins`) | — |
| Claim on existing profile | admin notify | `notifyAdmins` |
| Admin approves claim | "Claim approved ✓" | `claimApprovedEmail` |
| Day-10 completion nudge / manual nudge | "Finish your profile" | `nudgeEmailHtml` (unchanged) |
