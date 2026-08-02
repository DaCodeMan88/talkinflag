import { confirmationEmailHtml } from "@/lib/email";

export interface AssessmentNudgeEmail { subject: string; html: string; }

/**
 * Warm, no-guilt nudge for someone who started an assessment, made real
 * progress, then stepped away. Same tone rule as the denial emails: encourage,
 * never scold. Pure function — returns {subject, html}, sends nothing.
 */
export function assessmentNudgeEmail({
  firstName,
  kind,
  answered,
  total,
  resumeUrl,
}: {
  firstName: string;
  kind: "eval" | "iq";
  answered: number;
  total: number;
  resumeUrl: string;
}): AssessmentNudgeEmail {
  const remaining = Math.max(total - answered, 0);
  const noun = kind === "eval" ? "your evaluation" : "your Flag IQ quiz";

  return {
    subject: `You're ${remaining} questions from your result 🏈`,
    html: confirmationEmailHtml({
      heading: `Pick up right where you left off, ${firstName} 🏈`,
      body:
        `You're already ${answered} of ${total} questions into ${noun} — that's real progress, ` +
        `and your answers are saved. Just ${remaining} more and you'll unlock your full result.<br/><br/>` +
        `<a href="${resumeUrl}" style="color:#FDDD58;font-weight:bold;">Finish ${noun} →</a>` +
        `<br/><br/>Take your time — it'll be waiting whenever you're ready. We're rooting for you.`,
    }),
  };
}
