# Runbook: deleting members, players and claims

Who this is for: whoever is working in `/admin` and needs to remove someone or
something. It says exactly what each button destroys, what it leaves behind, and
who gets told.

The short version: **the admin panel has three different "remove" actions and
they are not interchangeable.**

---

## What each action actually does

| Action | Where in `/admin` | What it destroys | What it keeps | Who is told |
| --- | --- | --- | --- | --- |
| **Delete member** | Members list → Delete | The person's login (email, password, Google sign-in). They can no longer sign in. | The player profile, if they had claimed one. It stays on the site as an **unclaimed** record, no longer linked to anyone. | The member gets an email saying their login was removed and that a linked profile stays up as an unclaimed record, with a link to the contact form. Nothing is sent if the account has no email on record. |
| **Delete player** | Players list → Delete | The player row and everything on it — stats, bio, photo link, highlight link. Permanent. | The person's login, if they had one. It survives untouched. | **Nobody.** No email is sent. See below. |
| **Release claim** | Player edit page → the claim toggle, or Claims screen | Nothing. It only breaks the link between a login and a profile. | Both. The profile goes back to unclaimed and stays public; the login keeps working. | Nobody. |

---

## Which one to reach for

**Someone asked to be removed.**
Ask which one they mean — their account, or their public profile — because
they are separate things and Delete member does not take the profile down.
If they want both: **Release claim first, then Delete player, then Delete
member.** If they only want to stop being listed publicly, Delete player is the
one. If they only want their login gone, Delete member.

**A duplicate profile.**
Delete player on the duplicate. Check first whether the duplicate is the claimed
one — if it is, Release claim on it first, and make sure the claim ends up on
the row you are keeping.

**A spam signup.**
Delete member. Spam accounts almost never have a claimed profile, so there is
usually nothing else to clean up. If the spam account also created a junk player
row, Release claim, then Delete player on that row too.

---

## ⚠️ Delete player is a hard delete

**`deletePlayer` deletes the row outright. There is no unlink step and no
archive — the record is gone and cannot be restored from the admin panel.**

**If the row was claimed, the person's login is left pointing at a profile that
no longer exists.** Nothing cleans that up automatically.

**So: release the claim first, then delete the player row.** Releasing first
detaches the login cleanly, so the account is left in a normal signed-out state
rather than an orphaned one, and the claim history records the release.

---

## Why Delete player sends no email — a decision, not an oversight

There are 412 player rows on the site and only 3 of them are claimed. The rest
are records compiled from public sources: there is no account, no email address,
and no person who ever signed up behind them.

Emailing on player deletion would therefore mean, in almost every case, either
sending nothing at all or mailing someone who never asked to hear from us. So
player deletion is silent on purpose. Deleting a member — where there is by
definition an account holder — does send a notice.

If that ever needs to change (for example if most rows become claimed), it is a
deliberate reversal, not a bug fix. There is a comment on `deletePlayer` in
`src/app/admin/players/actions.ts` saying so.

---

## Compliance surface — flag these, do not decide them

These are things to raise, not things to settle from this page:

- **Minors' data.** Player rows include names, schools, graduation years and
  locations for people who may be under 18, and most were compiled from public
  sources rather than submitted.
- **The under-14 line in the Terms.** `src/app/terms/page.tsx` states that if we
  learn we have account information from someone under 14, we will delete it.
  There is no admin workflow that implements that today — it would be done by
  hand with Delete member.
- **Erasure requests.** The privacy page points people at the contact form. When
  one arrives, the decision about what gets removed, and how fast, is not one to
  make from the admin panel alone.

Confirm with Daniel or licensed counsel before acting.
