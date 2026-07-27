export interface DenialPreset { label: string; reason: string; fix: string; }

// Tone rule: affirm first, direct next, never "rejected/failed". Owner-editable.
export const DENIAL_PRESETS: Record<string, DenialPreset> = {
  highlight_broken: {
    label: "Highlight link doesn't work",
    reason: "We couldn't open your highlight link, so we can't show your game off yet.",
    fix: "Add a working highlight link (YouTube or Hudl) to real game or combine footage, then resubmit.",
  },
  incomplete_info: {
    label: "Profile needs a little more",
    reason: "A couple of key details are missing, so your profile isn't ready to shine yet.",
    fix: "Fill in your position, level, and team/school so coaches and scouts can find you.",
  },
  photo_needed: {
    label: "Needs a clear photo",
    reason: "Your profile doesn't have a clear photo of you yet.",
    fix: "Add a clear headshot or action shot — it's the first thing scouts look for.",
  },
  cant_verify: {
    label: "Couldn't verify it's you",
    reason: "We want to make sure every profile belongs to the right athlete before it goes live.",
    fix: "Reply to this email from the address on your roster, or add your verified social handle, and resubmit.",
  },
  possible_duplicate: {
    label: "Possible duplicate",
    reason: "It looks like there may already be a profile for you on Talkin Flag.",
    fix: "Search your name on talkinflag.com and claim your existing profile — reach out if you can't find it.",
  },
};

export function isDenialPreset(key: string): key is keyof typeof DENIAL_PRESETS {
  return Object.prototype.hasOwnProperty.call(DENIAL_PRESETS, key);
}
