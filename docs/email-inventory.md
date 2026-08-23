# Email inventory — what this site sends, when, and to whom

Every user-facing profile event, whether it notifies, and who gets the mail.
Written 2026-08-23. **Keep this current — it is the answer to "does the site tell
people what happens to them?", and it is the corpus the admin guide builds on.**

All mail goes through `sendEmail` in `src/lib/email.ts` (Resend). That helper
**never throws** — it returns `{ ok, error?, skipped? }`, and every skip logs the
intended recipient and subject. A failed email must never fail the flow that
triggered it. That was fixed after a July 2026 stress test lost ~6 emails
silently. **Do not undo it.**

Sender of record: `RESEND_FROM`, defaulting to `Talkin Flag <noreply@talkinflag.com>`.

---

## Profile lifecycle

| Event | Trigger | Template | Recipient | Notified |
|---|---|---|---|---|
| Profile submitted | `api/players/submit` | `pendingReceivedEmail` | submitter | Yes |
| Profile approved → live | `approvePlayer` | `approvedLiveEmail` | `claimed_by` | Yes |
| Profile denied | `denyPlayer` | `deniedEmail` | `claimed_by` | Yes |
| Claim submitted | `api/players/[id]/claim` | `claimReceivedEmail` | claimant | Yes *(added 08-23)* |
| Claim approved | `approveClaim` | `claimApprovedEmail` | claimant | Yes |
| Claim released by admin | `toggleClaim(id, false)` | `claimReleasedEmail` | prior `claimed_by` | Yes *(added 08-23)* |
| Claim released via report | `releaseFromReport` → delegates | `claimReleasedEmail` | prior `claimed_by` | Yes — **via delegation, deliberately not a second send** |
| Change request approved | `PATCH api/admin/change-requests/[id]` | `changeRequestDecidedEmail` | `claimed_by` | Yes *(added 08-23)* |
| Change request rejected | same | `changeRequestDecidedEmail` | `claimed_by` | Yes *(added 08-23)* |
| Verification decided | `api/admin/verifications/[id]` | verification template | claimant | Yes |
| Career update decided | `api/admin/career-updates/[id]` | career-update template | claimant | Yes |
| Member (auth account) deleted | `deleteMember` | `accountDeletedEmail` | removed user | Yes *(added 08-23)* |
| Profile nudge | `sendNudge` / nudge cron | `nudgeEmailHtml` | target user | Yes |

## Deliberate silences — decisions, not gaps

| Event | Why silent |
|---|---|
| **Player row deleted** (`deletePlayer`) | 412 player rows, **3 claimed.** Most are compiled from public sources with no account behind them — mailing on those means mailing people who never signed up. In-code comment + `runbook-account-deletion.md`. |
| **Admin edits a profile field** (`updatePlayer`) | Ambra edits profiles routinely during moderation. An email per save is noise. |
| **Change request on an unclaimed profile** | No account is linked. There is nobody to tell. |

## ⚠️ Open — not yet decided

| Event | Question |
|---|---|
| **Report dismissed** (`dismissReport`) | The *reporter* is told nothing. Different shape from the rows above — the reporter is not the profile owner, and may not have an account at all. **Needs a decision either way.** |

## Scheduled sends

| Cron | Path | Schedule |
|---|---|---|
| Recompute rankings | `/api/admin/recompute-rankings` | Sundays 02:00 |
| Weekly digest | `/api/digest/send` | Sundays 09:00 |
| Nudges | `/api/nudges/send` | Daily 15:00 |
| Assessment nudge | `/api/cron/assessment-nudge` | Daily 16:00 |

⚠️ **Unverified:** the daily nudge (15:00) and the assessment nudge (16:00) fire an
hour apart. **Confirm one person cannot receive both on the same day.** Not checked
as of 2026-08-23.

## Non-profile mail

Contact form · coach applications · scout applications · event submit and approve ·
recruiting-interest notifications · auth callback.
