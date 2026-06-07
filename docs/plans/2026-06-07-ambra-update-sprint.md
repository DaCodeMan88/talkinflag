# Ambra Update Sprint — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close the three buildable gaps from Ambra's meeting notes (events approval + rejection email, About bio closing paragraph, Partners section) and produce a ready-to-send status email to Ambra by Sunday night.

**Architecture:** Next.js 15 App Router site already live on Vercel. We add (1) an `is_approved` moderation gate + admin queue + Resend rejection email for community-submitted events, (2) a small content edit on `/about`, and (3) a data-driven Partners strip component on the homepage. No new libraries. DB change applied via Supabase MCP `apply_migration`. Verification is `npm run lint` + `npm run build` + browser preview (this project has **no unit-test runner** — only `dev`/`build`/`start`/`lint`).

**Tech Stack:** Next.js 15, TypeScript, Tailwind v3, Supabase (`@/lib/supabase/server`), Resend via `@/lib/email.ts`, Vercel.

---

## Context the executor needs (read first)

- This plan was scoped against Ambra's meeting notes. **Most notes are already shipped** (bios, host IG handles, contact email, `/media` gallery+IG, free player profiles). Do **not** rebuild those.
- **Deferred to the email, do NOT build** (owner decided): Google AdSense, "Talkin Flag vs Talkinflag" naming sweep, and the Talkin Balls website/IG links. These go in the email's "decisions for Ambra" section (Task 5), not in code.
- Patterns to mirror exactly (already in repo):
  - Admin page auth gate: `src/app/admin/scouts/page.tsx` (lines: `getUser()` → `redirect("/auth/login")` → `ADMIN_EMAILS` check → `redirect("/dashboard")`).
  - Approve/Reject client buttons: `src/app/admin/scouts/ApproveRejectButtons.tsx`.
  - Approve/Reject API route: `src/app/api/scouts/approve/route.ts` (auth gate + service-role client for writes).
  - Email sender: `sendEmail({ to, subject, html, replyTo })` from `src/lib/email.ts` (no-ops gracefully if `RESEND_API_KEY` unset).
- Brand: yellow `#FDDD58` (`brand-yellow`), black `#000000` (`brand-black`), `font-display uppercase tracking-widest` for headings.
- Start clean on `main` (status clean, latest commit `60bfad1`). Commit after each task.

---

## Task 1: About page — add the shared closing bio paragraph

**Why:** Ambra's notes end the bios with a joint paragraph that is not on the page yet.

**Files:**
- Modify: `src/app/about/page.tsx` (the "Meet the Hosts" section, after the `</div>` that closes the two-column `HostCard` grid, ~line 93)

**Step 1: Add the paragraph below the host-card grid**

In `src/app/about/page.tsx`, find the closing of the host grid:

```tsx
            />
          </div>
        </div>
      </section>
```

Insert the paragraph between the grid `</div>` and the `</div>` that closes `max-w-4xl`:

```tsx
            />
          </div>
          <p className="mt-12 text-brand-white/60 text-center text-base leading-relaxed max-w-2xl mx-auto">
            Together, Ambra and Tika leverage their academic and athletic
            backgrounds to explore not only how the sport is played, but how
            athletes think, prepare, and perform under pressure.
          </p>
        </div>
      </section>
```

**Step 2: Lint + build**

Run: `npm run lint && npm run build`
Expected: PASS, no new errors on `about/page.tsx`.

**Step 3: Preview verify**

Start the dev server (preview_start), navigate to `/about`, preview_snapshot.
Expected: the new paragraph renders centered below the two host cards, above the Watch & Subscribe panel.

**Step 4: Commit**

```bash
git add src/app/about/page.tsx
git commit -m "feat(about): add shared closing bio paragraph from Ambra's notes"
```

---

## Task 2: Partners section on the homepage

**Why:** Ambra asked whether to feature partners (Flagfootballfinder, Athleads), now listed on the Talkin Balls Network page. We ship a tasteful, data-driven strip. **URLs are unconfirmed → they live in one array and are flagged as an owner action in the email.**

**Files:**
- Create: `src/components/home/PartnersStrip.tsx`
- Modify: `src/app/page.tsx` (import + render before the closing `</>`, just above `<Footer/>` is rendered by layout — place it after the last existing home section, e.g. after `<BlogTeaser/>`)

**Step 1: Create the component**

Create `src/components/home/PartnersStrip.tsx`:

```tsx
import { ScrollReveal } from "@/components/ui/ScrollReveal";

// NOTE (owner action): confirm/replace these URLs with Ambra before publishing.
const PARTNERS: { name: string; url: string }[] = [
  { name: "Flag Football Finder", url: "https://flagfootballfinder.com" },
  { name: "Athleads", url: "https://athleads.com" },
];

export function PartnersStrip() {
  return (
    <section className="bg-brand-black border-t border-brand-white/5 py-16 px-6" aria-label="Partners">
      <div className="max-w-5xl mx-auto text-center">
        <ScrollReveal direction="up">
          <p className="text-brand-yellow font-display text-[10px] uppercase tracking-[0.4em] mb-6">
            Our Partners
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {PARTNERS.map((p) => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-display uppercase tracking-[0.2em] text-lg text-brand-white/70 hover:text-brand-yellow transition-colors"
              >
                {p.name}
              </a>
            ))}
          </div>
          <p className="mt-6 text-brand-white/30 text-xs max-w-md mx-auto">
            Proud to partner with organizations growing flag football worldwide.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
```

**Step 2: Verify `ScrollReveal` import path**

Run: `cat src/components/home/BlogTeaser.tsx | grep -n ScrollReveal` (or grep the repo). Confirm `@/components/ui/ScrollReveal` is correct; the homepage already imports it at `src/app/page.tsx:13`. If `ScrollReveal` causes any issue, drop it and use a plain `<div>` — it is purely cosmetic.

**Step 3: Render it on the homepage**

In `src/app/page.tsx`, add to imports (near the other `@/components/home/*` imports, ~line 8):

```tsx
import { PartnersStrip } from "@/components/home/PartnersStrip";
```

Then render it as the last content section before the closing `</>` of `HomePage` (after the final existing home teaser section). Example placement:

```tsx
      <BlogTeaser />
      <PartnersStrip />
    </>
```

(Match whatever the actual last section is — place `PartnersStrip` immediately before the fragment close.)

**Step 4: Lint + build**

Run: `npm run lint && npm run build`
Expected: PASS.

**Step 5: Preview verify**

Reload `/` (preview), scroll to the bottom, preview_screenshot.
Expected: "Our Partners" strip with Flag Football Finder + Athleads links, on-brand, above the footer.

**Step 6: Commit**

```bash
git add src/components/home/PartnersStrip.tsx src/app/page.tsx
git commit -m "feat(home): add Partners strip (Flag Football Finder, Athleads)"
```

---

## Task 3: Events approval gate + admin queue + rejection email

**Why:** Today, `POST /api/events/submit` inserts directly into `events` and the public `/events` page shows everything (`src/app/events/page.tsx` selects with only a `start_date` filter). Ambra wants to **approve submissions** on a cadence and **email a rejection**. The submit form also collects **no submitter email**, so we add one (optional) — without it, rejection emails are impossible.

This task has six sub-steps (3.1–3.6). Commit once at the end of the task (or after 3.1 if you want a checkpoint).

### 3.1 — Database migration (Supabase MCP)

Use the Supabase MCP `apply_migration` (project `wxeuybksowhncalrnttl`).

Migration name: `events_approval_gate`

```sql
-- Add moderation gate + submitter email
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS submitter_email text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS rejected_at timestamptz;

-- Backfill: every event that already exists is trusted/curated → approve it,
-- so nothing currently visible disappears.
UPDATE events SET is_approved = true WHERE is_approved = false;
```

**Verify:** run `list_tables` (or `execute_sql: select count(*) filter (where is_approved) as approved, count(*) total from events;`). Expected: `approved == total` (all existing events approved). New submissions will default to `is_approved = false`.

> ⚠️ Per CLAUDE.md, the `_backup_*` tables drop is a separate owner action — do NOT touch it here.

### 3.2 — Gate the public events query

**File:** `src/app/events/page.tsx`

Find both `.from("events")` queries (the upcoming query ~line 23 and the past query ~line 29). Add `.eq("is_approved", true)` to **each** query chain.

Upcoming (~line 23):
```tsx
      .from("events")
      .select("*")
      .eq("is_approved", true)
      .gte("start_date", today)
      .order("start_date", { ascending: true })
```

Past (~line 29):
```tsx
      .from("events")
      .select("id, title, start_date, end_date, city, country, country_code, level, event_type, website_url, is_featured")
      .eq("is_approved", true)
      .lt("start_date", today)
      .order("start_date", { ascending: false })
```

**Also gate** the single-event page so an unapproved event can't be reached by URL: in `src/app/events/[id]/page.tsx`, find the `.from("events").select(...).eq("id", ...)` query and add `.eq("is_approved", true)` (or, if it uses `.single()`, keep `.single()` and add the filter before it; a missing/unapproved event should `notFound()`).

**Verify:** grep to confirm no other public read of `events` is left ungated:
`grep -rn 'from("events")' src/app` — review each; the only ungated reads allowed are inside `src/app/admin/**` and `src/app/api/admin/**`.

### 3.3 — Collect submitter email on the submit form + route

**File:** `src/app/events/submit/page.tsx`
Add an optional email input (mirror the existing input markup/classes). Place it after the website field (~line 200). Use `name="submitter_email"` and `type="email"`:

```tsx
            <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2" htmlFor="submitter_email">
              Your Email (optional — so we can follow up)
            </label>
            <input
              id="submitter_email"
              name="submitter_email"
              type="email"
              placeholder="you@example.com"
              className="w-full bg-brand-black border border-brand-white/15 px-4 py-3 text-brand-white placeholder:text-brand-white/25 focus:border-brand-yellow focus:outline-none"
            />
```

Ensure the form's submit handler includes `submitter_email` in the JSON body it POSTs (it already serializes the form — confirm the field is read from `FormData`/state and added to the payload object sent to `/api/events/submit`).

**File:** `src/app/api/events/submit/route.ts`
In the `insert({...})` object, add:

```tsx
      submitter_email: body.submitter_email?.trim().slice(0, 200) || null,
      is_approved: false, // explicit: submissions require admin approval
```

(`is_approved` already defaults to `false` in the DB, but set it explicitly for clarity.)

### 3.4 — Admin queue page

**File (create):** `src/app/admin/events/page.tsx`

Mirror `src/app/admin/scouts/page.tsx` exactly for the auth gate and layout. Query pending vs reviewed by `is_approved` / `rejected_at`:

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EventApproveRejectButtons from "./EventApproveRejectButtons";

export const metadata = { title: "Event Submissions | Admin" };

export default async function AdminEventsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());
  if (!adminEmails.includes(user.email ?? "")) redirect("/dashboard");

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("is_approved", false)
    .is("rejected_at", null)
    .order("created_at", { ascending: false });

  const pending = events ?? [];

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="border-l-4 border-brand-yellow pl-6 mb-10">
          <h1 className="font-display text-4xl uppercase text-brand-white leading-none">Event Submissions</h1>
          <p className="text-brand-white/40 mt-2 text-sm">{pending.length} pending review</p>
        </div>

        {pending.length === 0 && (
          <p className="text-brand-white/30 text-sm mb-10">No pending submissions.</p>
        )}

        <div className="space-y-4">
          {pending.map((ev) => (
            <div key={ev.id} className="bg-[#0d0d0d] border border-brand-white/10 p-6 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-brand-white font-semibold">{ev.title}</p>
                  <p className="text-brand-white/40 text-sm">
                    {[ev.city, ev.country].filter(Boolean).join(", ")} · {new Date(ev.start_date).toLocaleDateString()}
                  </p>
                  {ev.event_type && <p className="text-brand-white/30 text-xs mt-1">{ev.event_type} · {ev.level ?? "—"}</p>}
                </div>
                <span className="text-brand-white/20 text-xs font-display uppercase tracking-widest flex-shrink-0">
                  {ev.created_at ? new Date(ev.created_at).toLocaleDateString() : ""}
                </span>
              </div>
              {ev.description && <p className="text-brand-white/60 text-sm">{ev.description}</p>}
              {ev.website_url && (
                <a href={ev.website_url} target="_blank" rel="noopener noreferrer" className="text-brand-yellow text-xs hover:underline break-all">
                  {ev.website_url}
                </a>
              )}
              <p className="text-brand-white/30 text-xs">
                Submitter: {ev.submitter_email || "— (no email provided)"}
              </p>
              <EventApproveRejectButtons eventId={ev.id} canEmail={!!ev.submitter_email} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

> If `events` has no `created_at` column, drop that field from the select/order and the displayed date. Confirm with `list_tables` before writing; adjust if needed.

### 3.5 — Approve/Reject client buttons

**File (create):** `src/app/admin/events/EventApproveRejectButtons.tsx`

Mirror `ApproveRejectButtons.tsx`, but Reject prompts whether to email the submitter:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EventApproveRejectButtons({ eventId, canEmail }: { eventId: string; canEmail: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function act(action: "approve" | "reject") {
    setPending(true);
    let notify = false;
    if (action === "reject" && canEmail) {
      notify = window.confirm("Send a rejection email to the submitter?");
    }
    await fetch("/api/events/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: eventId, action, notify }),
    });
    setPending(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3 pt-3 border-t border-brand-white/5">
      <button
        onClick={() => act("approve")}
        disabled={pending}
        className="bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-xs py-2 px-5 hover:bg-brand-yellow/90 transition-colors disabled:opacity-50"
      >
        Approve
      </button>
      <button
        onClick={() => act("reject")}
        disabled={pending}
        className="border border-red-500/40 text-red-400 font-display uppercase tracking-widest text-xs py-2 px-5 hover:border-red-500/70 transition-colors disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}
```

### 3.6 — Approve/Reject API route with rejection email

**File (create):** `src/app/api/events/approve/route.ts`

Mirror `src/app/api/scouts/approve/route.ts` for the auth + service-role pattern:

```tsx
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());
  if (!adminEmails.includes(user.email ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { event_id, action, notify } = await req.json();
  if (!event_id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: ev } = await admin.from("events").select("*").eq("id", event_id).single();
  if (!ev) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "approve") {
    await admin.from("events").update({ is_approved: true, rejected_at: null }).eq("id", event_id);
  } else {
    await admin.from("events").update({ is_approved: false, rejected_at: new Date().toISOString() }).eq("id", event_id);
    if (notify && ev.submitter_email) {
      await sendEmail({
        to: ev.submitter_email,
        subject: "About your Talkin Flag event submission",
        html: `
          <div style="font-family: Arial, sans-serif; color: #111;">
            <p>Hi,</p>
            <p>Thanks for submitting <strong>${ev.title}</strong> to the Talkin Flag events calendar.</p>
            <p>After review, we're not able to add this one to the calendar right now. This is often because the event falls outside our flag-football focus, is missing details, or couldn't be verified. You're welcome to resubmit with more information.</p>
            <p>Thanks for helping grow the game.<br/>— The Talkin Flag Team</p>
          </div>
        `,
        replyTo: "talkinflagshow@gmail.com",
      });
    }
  }

  return NextResponse.json({ ok: true });
}
```

> Note: `sendEmail` no-ops (with a console warning) when `RESEND_API_KEY` is unset, so approve/reject still works locally and in prod before the key is added. The key is already a tracked owner action.

### 3.7 — Surface the queue in the admin home + verify

**File:** `src/app/admin/page.tsx`
Add an "Event Submissions" card/link with a live pending count, mirroring the existing pending-count cards. Query:
```tsx
const { count: pendingEvents } = await supabase
  .from("events")
  .select("id", { count: "exact", head: true })
  .eq("is_approved", false)
  .is("rejected_at", null);
```
Render a link to `/admin/events` showing `pendingEvents ?? 0` in the same visual style as the other admin cards.

**Step — Lint + build**

Run: `npm run lint && npm run build`
Expected: PASS.

**Step — Preview verify (end-to-end)**

1. preview: submit a test event at `/events/submit` (include a submitter email).
2. Confirm it does **not** appear on `/events` (gated).
3. Visit `/admin/events` (must be signed in as an `ADMIN_EMAILS` user) → the test event is listed.
4. Click **Approve** → it now appears on `/events`.
5. Submit a second test event → **Reject** (decline the email prompt locally) → confirm it leaves the queue and never shows publicly.
6. preview_screenshot of `/admin/events`.

Clean up test rows via Supabase MCP `execute_sql` (`delete from events where title ilike 'TEST %';`) when done.

**Step — Commit**

```bash
git add src/app/events src/app/admin/events src/app/api/events src/app/admin/page.tsx
git commit -m "feat(events): approval gate, admin review queue, and rejection email"
```

---

## Task 4: Final verification + deploy to Vercel production

**Step 1: Full build + lint**

Run: `npm run lint && npm run build`
Expected: clean.

**Step 2: Push to main (triggers Vercel auto-deploy)**

```bash
git push origin main
```

**Step 3: Confirm deploy**

Use the Vercel MCP (`list_deployments` / `get_deployment` for project `prj_wRtnbxsJQ53KLjXlQcW4UmixhBWF`) and confirm the latest production deployment is **Ready**. Spot-check live URLs: `https://talkinflag.vercel.app/about` (closing paragraph), `/` (Partners strip), `/events` (still populated — backfill worked), `/events/submit` (email field present).

> If `git push` has no remote/credentials, deploy via the Vercel MCP `deploy_to_vercel` instead, or stop and report so the owner can push.

---

## Task 5: Draft the Ambra update email

**Why:** This is the actual deliverable. Produce a ready-to-send email so the owner only has to review and hit send.

**File (create):** `docs/ambra-update-2026-06-07.md`

Write a friendly, structured email with these sections, filled in from this session's findings:

**1. What we have (live now)** — the site at talkinflag.vercel.app with: 6-section nav, ~374-player database + rankings (HS / College / World), podcast page with episode grid + pre-built Spotify widget, events calendar with submission, blog (23+ posts incl. 5 interview articles: Sowers, Clark-Robinson, Krouch, Doucette, Flores), media/gallery with IG embeds, player profile + claim system, coach/scout flows, About with both bios + IG links. **New this sprint:** events now have an admin approval queue + rejection email; About has the joint closing paragraph; homepage has a Partners strip.

**2. What we need from you/Ambra & Tika (owner actions)** — pull from CLAUDE.md "Owner Actions" + memory:
- Host photos: `public/ambra.jpg`, `public/tika.jpg`, `public/hosts-hero.jpg`
- Spotify show ID (`NEXT_PUBLIC_SPOTIFY_SHOW_ID`)
- Env vars in Vercel: `RESEND_API_KEY` (enables contact + welcome + **the new event rejection emails**), `YOUTUBE_API_KEY` (+ 5 interview video IDs), `ADMIN_EMAILS`, `CRON_SECRET`, `PRINTFUL_API_KEY`
- Domain decision: talkinflag.com vs talkinflagshow.com
- Confirm Partner URLs (Flag Football Finder, Athleads)
- 100-pt TF ranking rubric (from Ambra & Tika)

**3. Decisions still to make (from the meeting notes)** — list explicitly:
- "Talkin Flag" vs "Talkinflag" — recommend **Talkin Flag** (two words, current dominant usage); confirm so we can standardize.
- Google AdSense on Rankings/Blog — recommend deferring until ~10k monthly pageviews + AdSense approval; no code yet.
- Talkin Balls Network links — confirm we should add the website link (talkinballsnetwork.com) on the homepage + About, and the 4 IG handles (@talkinballsnetwork, @talkinballsnfl, @talkincollege, @talkinfantasyfootball) in the footer. (Built nothing yet — awaiting your go.)
- Partners section — shipped a placeholder; confirm partners + links, or we pull it.
- Player profiles: confirmed free to start, premium later. ✅
- Events cadence: approve weekly/biweekly via the new `/admin/events` queue; rejection email is live (pending `RESEND_API_KEY`).

**4. Still to be planned (roadmap)** — summarize the master plan phases A–G from `docs/plans/2026-06-06-community-rankings-platform.md` in one line each (highlight-clip blogs + Shorts, IQ quiz funnel, weighted Coaches/Experts/Hosts polls, the TF ranking algorithm, fundamentals course, career-update re-engagement, i18n + Mexico league). Plus "for later" items from her notes: merch + giveaways (code built, needs Printful key), podcast review/shoutout flow, "request a collab/podcast" button for brands.

**Step — Commit**

```bash
git add docs/ambra-update-2026-06-07.md
git commit -m "docs: draft Ambra status update email"
```

Then surface the drafted email to the owner (SendUserFile or paste it) for review before sending.

---

## Done criteria

- [ ] `/about` shows the joint closing paragraph (live)
- [ ] Homepage shows the Partners strip (live)
- [ ] Submitted events are hidden until approved; `/admin/events` queue works; approve publishes; reject removes + can email the submitter
- [ ] Existing events still visible (backfill verified)
- [ ] `npm run lint && npm run build` clean; pushed; Vercel production **Ready**
- [ ] `docs/ambra-update-2026-06-07.md` drafted and surfaced to the owner

---

## Notes for the executor

- DRY: reuse the scouts admin/API patterns; don't invent new auth or email plumbing.
- YAGNI: Partners strip is one array; no CMS. Rejection email is one template; no template engine.
- Commit after each task. Keep diffs small and reviewable.
- This project has **no unit tests** — `npm run build` + browser preview is the verification gate. Do not scaffold a test runner for this sprint.
