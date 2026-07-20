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
