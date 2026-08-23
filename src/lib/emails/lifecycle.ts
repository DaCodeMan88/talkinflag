import { confirmationEmailHtml } from "@/lib/email";
import { DENIAL_PRESETS, isDenialPreset } from "@/lib/review/denial-presets";

export interface LifecycleEmail { subject: string; html: string; }

export function pendingReceivedEmail(firstName: string): LifecycleEmail {
  const name = firstName?.trim() || "there";
  return {
    subject: "Your Talkin Flag profile is in review 🏈",
    html: confirmationEmailHtml({
      heading: "Profile received!",
      body: `Thanks ${name} — you're in the queue. An admin reviews every profile so the ` +
        `TF community stays real. We'll email you the moment yours is live.`,
    }),
  };
}

export function approvedLiveEmail(firstName: string): LifecycleEmail {
  const name = firstName?.trim() || "there";
  return {
    subject: "You're live on Talkin Flag ✅",
    html: confirmationEmailHtml({
      heading: `You're live, ${name}!`,
      body: `Your profile is approved and visible to coaches, scouts, and national-team selectors.<br/><br/>` +
        `<a href="https://talkinflag.com/dashboard" style="color:#FDDD58;font-weight:bold;">Open your dashboard →</a>`,
    }),
  };
}

// Receipt at claim time. Without it a claimant hears nothing until an admin
// acts — and every self-service route rejects while claim_pending is true, so
// the site just looks broken. Say the lock out loud.
export function claimReceivedEmail(firstName: string): LifecycleEmail {
  const name = firstName?.trim() || "there";
  return {
    subject: "We got your profile claim",
    html: confirmationEmailHtml({
      heading: "Claim received",
      body: `Hi ${name}, we've got your claim and a member of our team will review it. ` +
        `Until it's approved, your profile can't be edited — that check is how we keep ` +
        `profiles from being claimed by the wrong person.<br/><br/>` +
        `We'll email you as soon as it's approved. If you need an update in the meantime, ` +
        `reach us at <a href="https://talkinflag.com/contact" style="color:#FDDD58;font-weight:bold;">talkinflag.com/contact</a>.`,
    }),
  };
}

export function claimApprovedEmail(firstName: string): LifecycleEmail {
  const name = firstName?.trim() || "there";
  return {
    subject: "Your profile claim is approved ✓",
    html: confirmationEmailHtml({
      heading: "Claim approved ✓",
      body: `Hi ${name}, your claim is verified. You can now edit your profile, add highlights, ` +
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
  const name = firstName?.trim() || "there";
  const noteHtml = note?.trim()
    ? `<br/><br/><em style="color:#ffffff99;">A note from our team: ${note.trim()}</em>` : "";
  return {
    subject: "One quick step before your profile goes live",
    html: confirmationEmailHtml({
      heading: `Almost there, ${name} 🏈`,
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

// Sent after an admin deletes an auth account in /admin/members. Deliberately
// flat: the recipient may never have wanted the account, or may have been
// removed for cause. Be exact about what survives — deleteMember unlinks a
// claimed player profile but does NOT delete it, and saying otherwise would be
// a false statement to someone about their own data.
export function accountDeletedEmail(firstName: string): LifecycleEmail {
  const name = firstName?.trim() || "there";
  return {
    subject: "Your Talkin Flag account has been removed",
    html: confirmationEmailHtml({
      heading: "Account removed",
      body: `Hi ${name}, your Talkin Flag login has been removed and you can no longer sign in.<br/><br/>` +
        `If a player profile was linked to this account, that profile has not been deleted. ` +
        `It stays on the site as an unclaimed record and is no longer connected to you.<br/><br/>` +
        `If you have a question about this, or you want a player profile removed as well, reach us at ` +
        `<a href="https://talkinflag.com/contact" style="color:#FDDD58;font-weight:bold;">talkinflag.com/contact</a>.`,
    }),
  };
}

// A change request is the one profile event the user started themselves, so
// silence reads as the site swallowing it. Names the field either way and
// only mentions a note when an admin actually wrote one.
export function changeRequestDecidedEmail(
  firstName: string,
  field: string,
  approved: boolean,
  note?: string,
): LifecycleEmail {
  const name = firstName?.trim() || "there";
  const noteHtml = note?.trim()
    ? `<br/><br/><em style="color:#ffffff99;">From our team: ${note.trim()}</em>` : "";
  const body = approved
    ? `Hi ${name}, the change you asked for to <strong>${field}</strong> has been approved ` +
      `and applied to your profile.`
    : `Hi ${name}, the change you asked for to <strong>${field}</strong> was reviewed and ` +
      `not applied. That field is unchanged on your profile.`;
  return {
    subject: approved
      ? "Your profile change request was approved"
      : "Your profile change request was reviewed",
    html: confirmationEmailHtml({
      heading: approved ? "Change applied ✓" : "Change not applied",
      body: `${body}${noteHtml}<br/><br/>` +
        `Questions about this? Reach us at ` +
        `<a href="https://talkinflag.com/contact" style="color:#FDDD58;font-weight:bold;">talkinflag.com/contact</a>.`,
    }),
  };
}

// Sent when a claim is released — by an admin toggle or as the outcome of a
// report. The recipient may have done nothing wrong, or may have claimed a
// profile that was not theirs, so this states the fact and nothing more: no
// apology, no accusation, and a route to ask.
export function claimReleasedEmail(firstName: string): LifecycleEmail {
  const name = firstName?.trim() || "there";
  return {
    subject: "A profile claim on your Talkin Flag account has been released",
    html: confirmationEmailHtml({
      heading: "Profile claim released",
      body: `Hi ${name}, a player profile that was linked to your Talkin Flag account is ` +
        `no longer linked to it. You can no longer edit that profile, and it stays on the ` +
        `site as an unclaimed record.<br/><br/>` +
        `Your account itself is unchanged and you can still sign in.<br/><br/>` +
        `If you have a question about this, reach us at ` +
        `<a href="https://talkinflag.com/contact" style="color:#FDDD58;font-weight:bold;">talkinflag.com/contact</a>.`,
    }),
  };
}
