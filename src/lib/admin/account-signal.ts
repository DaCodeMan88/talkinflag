/**
 * Reads how alive an account is, from counts alone. Pure — no I/O, no Supabase.
 *
 * The point of this is to tell a half-built human account apart from an empty
 * shell. A saved form draft is the strongest tell we have: a bot does not come
 * back and resume a form.
 */

/** An account younger than this is too new to judge — it is held as "new". */
export const NEW_ACCOUNT_DAYS = 14;

/** Sign-up routes that already proved a human before the account existed. */
const OAUTH_PROVIDERS = new Set(["google", "apple", "azure", "facebook", "github", "twitter"]);

export interface AccountSignalInput {
  /** The provider the account signed up with, e.g. "google" or "email". */
  provider: string;
  evals: number;
  sessions: number;
  drafts: number;
  hasPlayer: boolean;
  hasCoach: boolean;
  nudges: number;
  emailConfirmed: boolean;
  createdAt: string;
  now: Date;
}

export type AccountSignalLevel = "active" | "new" | "empty" | "spam";

export interface AccountSignalResult {
  level: AccountSignalLevel;
  reason: string;
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

function ageInDays(createdAt: string, now: Date): number {
  return (now.getTime() - new Date(createdAt).getTime()) / 864e5;
}

export function accountSignal(input: AccountSignalInput): AccountSignalResult {
  const { evals, sessions, drafts, hasPlayer, hasCoach, nudges, provider, emailConfirmed } = input;

  // 1. Any evidence of work at all.
  if (drafts > 0) {
    return { level: "active", reason: "Saved a draft — a bot doesn't resume a form." };
  }
  if (evals > 0) {
    return { level: "active", reason: `Completed ${plural(evals, "evaluation", "evaluations")}.` };
  }
  if (sessions > 0) {
    return { level: "active", reason: `Started ${plural(sessions, "assessment", "assessments")}.` };
  }

  // 2. A linked profile is a real person on the other end, even if quiet since.
  if (hasCoach) {
    return { level: "active", reason: "Linked to a coach profile — a known person." };
  }
  if (hasPlayer) {
    return { level: "active", reason: "Linked to a player profile — a known person." };
  }

  // 3. Too new to judge.
  const days = Math.floor(ageInDays(input.createdAt, input.now));
  if (days < NEW_ACCOUNT_DAYS) {
    return {
      level: "new",
      reason:
        days < 1
          ? "Signed up today — too new to judge."
          : `Signed up ${plural(days, "day", "days")} ago — too new to judge.`,
    };
  }

  // 4. Spam needs BOTH a self-serve sign-up and an email nobody ever confirmed.
  //    An OAuth account can never land here: Google already proved a human.
  const viaOAuth = OAUTH_PROVIDERS.has(provider);
  if (!viaOAuth && !emailConfirmed) {
    return { level: "spam", reason: "Email sign-up that was never confirmed, and no activity since." };
  }

  // 5. Quiet, but a real sign-up.
  const nudged =
    nudges > 0 ? ` nudged ${nudges === 1 ? "once" : plural(nudges, "time", "times")}.` : " never nudged.";
  return {
    level: "empty",
    reason: `No activity since signing up${viaOAuth ? ` with ${provider}` : ""};${nudged}`,
  };
}
