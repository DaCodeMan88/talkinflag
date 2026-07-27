# Talkin Flag — Player Review Workflow Update (2026-07-27)

Hi Ambra — two things: what happened with the "nudge," and the new sign-up review flow we built around it.

## First: the "nudge approved the profile" — good news, nothing broke

When you nudged that player and saw their profile as "approved," nothing was actually approved by the nudge. We checked it end to end:

- The **Nudge button only sends the reminder email** — it never touches a profile's approval status.
- The profile you saw (Aleena) had already been **live since June 25**, a month *before* you nudged her. It's one of the ~400 profiles we imported from public rosters, and imported profiles go live automatically so real athletes are findable.
- So it just *looked* like the nudge approved it, because the profile was already public.

The real problem was that the admin screens didn't make the difference clear — "imported and live" looked the same as "you approved this." We fixed that.

## What's new

**1. Every profile now shows its real status.** In **Members** and **Players**, each profile is clearly tagged:
- **Live ✓** — reviewed/approved
- **Awaiting review** — a new sign-up waiting on you
- **Imported · unreviewed** — auto-imported, live, but no human has checked it
- **Denied** — you sent it back with a reason
- "Claim pending" is now labeled separately, so a *claim* is never confused with *approval*.

**2. Denials are now kind and useful — not a delete.** On **Admin → Players → Pending Review**, each sign-up has **Approve** or **Deny**. When you Deny, you pick a friendly reason (e.g. "Highlight link doesn't work," "Needs a clear photo," "Couldn't verify it's you") and can add a personal note. The athlete gets an **encouraging email** — it tells them exactly what to fix, gives them a one-click way back, and keeps them feeling like part of the community (no "rejected" language anywhere). There's a new **Denied** tab so you can see and re-approve them. ("Delete" still exists, but only for real spam.)

**3. Athletes can fix and resubmit themselves.** A denied athlete sees the reason right on their dashboard with an "Update & resubmit" button — so they fix it and come back into your queue automatically, instead of disappearing.

**4. All the sign-up emails are consistent now** — "in review," "you're live," "claim approved," and the new encouraging "one step before you're live" denial email — same on-brand look.

## One thing to try when you have a minute
Go to **Admin → Players → Pending Review**, and (on a test sign-up) try **Deny** with a reason — you'll see the email that goes out. Tell me if you want any of the reason wording or tone changed; it's all easy to edit.
