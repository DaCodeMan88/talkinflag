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
