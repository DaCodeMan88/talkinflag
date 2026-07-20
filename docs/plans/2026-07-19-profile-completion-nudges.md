# Profile Completion Nudges Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or subagent-driven-development) to implement this plan task-by-task.

**Goal:** Automatically email a reminder to users who are 10+ days past signup and under 75% profile completion, and give admins a one-click "Nudge" button per member.

**Architecture:** A new `profile_nudges` table records every nudge (auto or manual) so the daily cron never re-nudges the same user and admins can see who was last nudged. A pure, unit-tested `src/lib/nudge.ts` holds the eligibility rule + email HTML. A Vercel cron GET route (`/api/nudges/send`) follows the exact auth pattern of the existing recompute-rankings cron. A `sendNudge` server action powers the admin button.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase (service-role admin client), Resend (`sendEmail`), Vitest, Vercel Cron.

**Key existing pieces to reuse (do NOT reinvent):**
- `sendEmail({to,subject,html})` and `confirmationEmailHtml({heading,body})` from `src/lib/email.ts`.
- `completionScore(player, stats)` from `src/lib/profile/completion.ts` → 0–100 int. Threshold is `< 75`.
- Cron auth pattern: `src/app/api/admin/recompute-rankings/route.ts` — `isCronRequest(req)` checks `Authorization: Bearer $CRON_SECRET`; Vercel invokes via **GET**.
- Admin gating: `getAdminUser()` from `src/lib/admin.ts`; service-only tables use `createAdminClient()` from `src/lib/eval/admin-client.ts`. (CLAUDE.md admin-gating rule + `src/lib/admin-gating.test.ts`.)
- Members data assembly: `src/app/admin/members/page.tsx` (auth.admin.listUsers + players joined by `claimed_by`).
- Existing member delete action + two-step UI: `src/app/admin/members/actions.ts`, `src/app/admin/members/MembersTable.tsx` (`DeleteMember` component is the pattern to mirror).

**Design decisions (already made — do not re-litigate):**
- Nudging is keyed to the **auth user**, not the player row. A user with no player profile (or an unclaimed one) computes as incomplete → eligible. This is exactly why Tristan (no profile) and Aleena (unclaimed) become nudgeable.
- Auto job eligibility: `ageDays >= 10 && completionPct < 75 && !alreadyAutoNudged && ageDays <= 45`. The 45-day upper bound stops the first run from emailing long-dormant accounts. Cap the batch at 50 sends per run.
- The auto job records `source = 'auto_day10'`; manual admin nudges record `source = 'admin'` + `sent_by`. Only `auto_day10` rows suppress future auto nudges (admins can nudge repeatedly).

---

### Task 1: `profile_nudges` table migration

**Files:**
- Create: `supabase/migrations/018_profile_nudges.sql`

**Step 1: Write the migration SQL**

```sql
-- 018_profile_nudges.sql
-- Records every profile-completion nudge (automated day-10 cron or manual admin
-- click) so the cron never re-nudges the same user and admins can see recency.
create table if not exists public.profile_nudges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('auto_day10', 'admin')),
  sent_by uuid references auth.users(id) on delete set null,
  sent_at timestamptz not null default now()
);

create index if not exists profile_nudges_user_id_idx on public.profile_nudges(user_id);
create index if not exists profile_nudges_source_idx on public.profile_nudges(source);

-- Service-role only: no RLS policies added, matching other admin-only tables.
alter table public.profile_nudges enable row level security;
```

**Step 2: Apply the migration**

Apply via the Supabase MCP `apply_migration` tool (project `wxeuybksowhncalrnttl`, name `018_profile_nudges`) using the SQL above. Then confirm with `list_tables` that `profile_nudges` exists.

Expected: table `public.profile_nudges` present with the two indexes.

**Step 3: Commit**

```bash
git add supabase/migrations/018_profile_nudges.sql
git commit -m "feat: profile_nudges table for completion reminders"
```

---

### Task 2: Pure eligibility + email module (TDD)

**Files:**
- Create: `src/lib/nudge.ts`
- Test: `src/lib/nudge.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { isEligibleForAutoNudge, nudgeEmailHtml, NUDGE_MIN_AGE_DAYS } from "./nudge";

describe("isEligibleForAutoNudge", () => {
  const base = { ageDays: 12, completionPct: 40, alreadyAutoNudged: false };
  it("nudges an incomplete 12-day-old user", () => {
    expect(isEligibleForAutoNudge(base)).toBe(true);
  });
  it("skips users younger than 10 days", () => {
    expect(isEligibleForAutoNudge({ ...base, ageDays: 9 })).toBe(false);
  });
  it("includes users with no profile (0% / null)", () => {
    expect(isEligibleForAutoNudge({ ...base, completionPct: 0 })).toBe(true);
  });
  it("skips users at or above 75%", () => {
    expect(isEligibleForAutoNudge({ ...base, completionPct: 75 })).toBe(false);
  });
  it("skips users already auto-nudged", () => {
    expect(isEligibleForAutoNudge({ ...base, alreadyAutoNudged: true })).toBe(false);
  });
  it("skips dormant accounts older than the max window", () => {
    expect(isEligibleForAutoNudge({ ...base, ageDays: 46 })).toBe(false);
  });
  it("exposes the day-10 threshold", () => {
    expect(NUDGE_MIN_AGE_DAYS).toBe(10);
  });
});

describe("nudgeEmailHtml", () => {
  it("greets by first name and links to the dashboard", () => {
    const html = nudgeEmailHtml("Tristan");
    expect(html).toContain("Tristan");
    expect(html).toContain("/dashboard");
  });
  it("falls back gracefully with no name", () => {
    expect(nudgeEmailHtml(null)).toContain("there");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/nudge.test.ts`
Expected: FAIL (module not found).

**Step 3: Write minimal implementation**

```ts
import { confirmationEmailHtml } from "./email";

export const NUDGE_MIN_AGE_DAYS = 10;
export const NUDGE_MAX_AGE_DAYS = 45;
export const NUDGE_COMPLETION_THRESHOLD = 75;

export function isEligibleForAutoNudge({
  ageDays,
  completionPct,
  alreadyAutoNudged,
}: {
  ageDays: number;
  completionPct: number;
  alreadyAutoNudged: boolean;
}): boolean {
  if (alreadyAutoNudged) return false;
  if (ageDays < NUDGE_MIN_AGE_DAYS || ageDays > NUDGE_MAX_AGE_DAYS) return false;
  return completionPct < NUDGE_COMPLETION_THRESHOLD;
}

export const NUDGE_SUBJECT = "Finish your Talkin Flag profile";

export function nudgeEmailHtml(firstName: string | null): string {
  const name = firstName?.trim() || "there";
  return confirmationEmailHtml({
    heading: `Hey ${name}, your profile is almost there`,
    body:
      `You started your Talkin Flag profile but haven't finished it yet. ` +
      `Completing it helps coaches, scouts, and fans find you — and unlocks ` +
      `your spot in the TF Rankings.<br/><br/>` +
      `<a href="https://talkinflag.com/dashboard/edit" style="color:#FDDD58;font-weight:bold;">` +
      `Finish your profile →</a>`,
  });
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/nudge.test.ts`
Expected: PASS (9 tests).

**Step 5: Commit**

```bash
git add src/lib/nudge.ts src/lib/nudge.test.ts
git commit -m "feat: nudge eligibility rule + reminder email builder"
```

---

### Task 3: Daily cron route `/api/nudges/send`

**Files:**
- Create: `src/app/api/nudges/send/route.ts`
- Modify: `vercel.json` (add cron entry)

**Step 1: Write the route**

Mirror `recompute-rankings/route.ts` auth exactly (GET is cron-only via `isCronRequest`; POST also allowed for an admin session so it can be triggered manually while testing).

```ts
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/eval/admin-client";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { completionScore } from "@/lib/profile/completion";
import { sendEmail } from "@/lib/email";
import { isEligibleForAutoNudge, nudgeEmailHtml, NUDGE_SUBJECT } from "@/lib/nudge";

const CRON_SECRET = process.env.CRON_SECRET ?? "";
const MAX_PER_RUN = 50;

function isCronRequest(req: NextRequest): boolean {
  const auth = req.headers.get("Authorization") ?? "";
  return Boolean(CRON_SECRET) && auth === `Bearer ${CRON_SECRET}`;
}

async function runNudges() {
  const db = createAdminClient();

  const [{ data: usersPage }, { data: players }, { data: nudged }] = await Promise.all([
    db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    db
      .from("players")
      .select("claimed_by, photo_url, bio, instagram, highlight_url, height_in, weight_lbs, stats")
      .not("claimed_by", "is", null),
    db.from("profile_nudges").select("user_id").eq("source", "auto_day10"),
  ]);

  const playerByUser = new Map((players ?? []).map((p) => [p.claimed_by as string, p]));
  const autoNudgedUsers = new Set((nudged ?? []).map((n) => n.user_id as string));
  const now = Date.now();

  let sent = 0;
  for (const u of usersPage?.users ?? []) {
    if (sent >= MAX_PER_RUN) break;
    if (!u.email) continue;

    const player = playerByUser.get(u.id);
    const completionPct = player
      ? completionScore(player as Record<string, unknown>, (player.stats ?? {}) as Record<string, unknown>)
      : 0;
    const ageDays = (now - new Date(u.created_at).getTime()) / 86_400_000;

    if (!isEligibleForAutoNudge({ ageDays, completionPct, alreadyAutoNudged: autoNudgedUsers.has(u.id) })) {
      continue;
    }

    const firstName = (u.user_metadata?.first_name as string | undefined) ?? null;
    const result = await sendEmail({ to: u.email, subject: NUDGE_SUBJECT, html: nudgeEmailHtml(firstName) });
    if (result.ok) {
      await db.from("profile_nudges").insert({ user_id: u.id, source: "auto_day10" });
      sent++;
    }
  }

  return NextResponse.json({ sent });
}

export async function GET(req: NextRequest) {
  if (!isCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runNudges();
}

export async function POST(req: NextRequest) {
  if (!isCronRequest(req)) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  return runNudges();
}
```

**Step 2: Add the cron schedule**

Edit `vercel.json` — add to the `crons` array (daily 15:00 UTC):

```json
{
  "path": "/api/nudges/send",
  "schedule": "0 15 * * *"
}
```

**Step 3: Verify it compiles**

Run: `npx tsc --noEmit` (ignore any stale `.next/dev/types` errors — run `rm -rf .next` first if they appear).
Expected: no errors in `src/app/api/nudges/send/route.ts`.

**Step 4: Commit**

```bash
git add src/app/api/nudges/send/route.ts vercel.json
git commit -m "feat: daily day-10 profile-completion nudge cron"
```

---

### Task 4: Admin `sendNudge` server action + surface last-nudged

**Files:**
- Modify: `src/app/admin/members/actions.ts` (add `sendNudge`)
- Modify: `src/app/admin/members/page.tsx` (load last-nudge timestamps, pass into rows)
- Modify: `src/app/admin/members/MembersTable.tsx` (add `lastNudgeAt` to `MemberRow`)

**Step 1: Add the server action** (append to `actions.ts`, reuse existing imports for `getAdminUser`, `createAdminClient`, `revalidatePath`):

```ts
export async function sendNudge(userId: string) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  const db = createAdminClient();
  const { data: userData } = await db.auth.admin.getUserById(userId);
  const email = userData?.user?.email;
  if (!email) throw new Error("This account has no email address.");

  const firstName = (userData.user?.user_metadata?.first_name as string | undefined) ?? null;
  const result = await sendEmail({ to: email, subject: NUDGE_SUBJECT, html: nudgeEmailHtml(firstName) });
  if (!result.ok) throw new Error(result.error ?? "Failed to send nudge email.");

  await db.from("profile_nudges").insert({ user_id: userId, source: "admin", sent_by: admin.id });
  revalidatePath("/admin/members");
}
```

Add imports at top of `actions.ts`: `import { sendEmail } from "@/lib/email";` and `import { nudgeEmailHtml, NUDGE_SUBJECT } from "@/lib/nudge";`.

**Step 2: Load last-nudge in the page** — in `page.tsx`, add to the `Promise.all` a query `db.from("profile_nudges").select("user_id, sent_at")`, build `const lastNudgeByUser = new Map<string,string>()` keeping the max `sent_at` per user, and set `lastNudgeAt: lastNudgeByUser.get(u.id) ?? null` on each `MemberRow`.

**Step 3: Add the field to the type** — in `MembersTable.tsx`, add `lastNudgeAt: string | null;` to the `MemberRow` interface.

**Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no new errors.

**Step 5: Commit**

```bash
git add src/app/admin/members/actions.ts src/app/admin/members/page.tsx src/app/admin/members/MembersTable.tsx
git commit -m "feat: sendNudge admin action + last-nudged tracking"
```

---

### Task 5: Nudge button in the members table UI

**Files:**
- Modify: `src/app/admin/members/MembersTable.tsx`

**Step 1: Add a `NudgeMember` component** modeled on `DeleteMember` (single click, `useTransition`, inline error, "Sent ✓" success state). No two-step confirm — sending a reminder is low-risk. Show a subtle "nudged {timeAgo}" hint when `member.lastNudgeAt` is set.

```tsx
function NudgeMember({ member }: { member: MemberRow }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={pending || sent}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            try {
              await sendNudge(member.id);
              setSent(true);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Failed to send nudge.");
            }
          })
        }
        className="text-white/30 hover:text-[#FDDD58] text-xs transition-colors disabled:opacity-50"
      >
        {sent ? "Sent ✓" : pending ? "Sending…" : "Nudge"}
      </button>
      {!sent && member.lastNudgeAt && (
        <span className="text-white/20 text-[10px]">nudged {timeAgo(member.lastNudgeAt)}</span>
      )}
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </span>
  );
}
```

Add `import { sendNudge } from "./actions";` (extend the existing `deleteMember` import line).

**Step 2: Render it** in both the desktop Actions cell and the mobile action row, before `DeleteMember`:

- Desktop cell: `<td className="px-4 py-3"><span className="inline-flex items-center gap-3"><NudgeMember member={m} /><DeleteMember member={m} currentUserId={currentUserId} /></span></td>`
- Mobile row: wrap the existing `DeleteMember` div to also include `<NudgeMember member={m} />`.

**Step 3: Verify build**

Run: `rm -rf .next && npx vitest run && npm run build`
Expected: tests pass, build exits 0.

**Step 4: Commit**

```bash
git add src/app/admin/members/MembersTable.tsx
git commit -m "feat: admin Nudge button per member"
```

---

### Task 6: End-to-end verification

**Files:** none (verification only)

**Step 1:** Start the dev server (launch.json config `talkinflag-dev`, or `npm run dev`) and open `/admin/members` in the browser pane as an admin.

**Step 2:** Confirm each member row shows a **Nudge** button (desktop table + mobile cards at 375px). Click Nudge on a test account; confirm the button shows "Sending…" → "Sent ✓" with no console errors. Check Vercel/dev logs for the `[email]` line (or a skip line if `RESEND_API_KEY` is unset locally — that's expected in dev).

**Step 3:** Confirm the "nudged {time} ago" hint renders after reload for the account you nudged (row now has `lastNudgeAt`).

**Step 4:** Sanity-check the cron auth: `curl` the route with no auth header → expect `401`; the eligibility logic itself is covered by `nudge.test.ts`.

**Step 5:** Final: `rm -rf .next && npx vitest run && npm run build` → all green.

---

## Notes for the executor
- **Do NOT** hardcode the Resend key or CRON_SECRET; both come from env (already set in Vercel).
- The auto job intentionally treats profile-less users (Tristan) and unclaimed-profile users (Aleena) as 0% → eligible. That is the whole point of Ambra's request.
- Keep the batch cap (`MAX_PER_RUN = 50`) — the first cron run will sweep the existing backlog of incomplete accounts within the 10–45 day window.
- Per project memory: after pushing, do **not** poll the Vercel deploy.
