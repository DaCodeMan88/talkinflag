import { confirmationEmailHtml } from "./email";

export const NUDGE_MIN_AGE_DAYS = 10;
export const NUDGE_MAX_AGE_DAYS = 45;
export const NUDGE_COMPLETION_THRESHOLD = 75;

// SAFETY CUTOFF: the automated cron must NEVER email the pre-launch backlog of
// login accounts (imported/early users who don't know about the site and whose
// email addresses were never confirmed). Only accounts created on/after this
// launch date are eligible for auto-nudges. The manual admin "Nudge" button is
// unaffected — an admin deliberately chooses each recipient.
export const NUDGE_LAUNCH_CUTOFF = "2026-07-19T00:00:00.000Z";

export function isEligibleForAutoNudge({
  ageDays,
  completionPct,
  alreadyAutoNudged,
  emailConfirmed,
  createdAt,
}: {
  ageDays: number;
  completionPct: number;
  alreadyAutoNudged: boolean;
  emailConfirmed: boolean;
  createdAt: string;
}): boolean {
  if (alreadyAutoNudged) return false;
  // Never auto-email an unconfirmed address, and never touch the pre-launch backlog.
  if (!emailConfirmed) return false;
  if (createdAt < NUDGE_LAUNCH_CUTOFF) return false;
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
