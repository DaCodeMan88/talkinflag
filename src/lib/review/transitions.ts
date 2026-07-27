import { DENIAL_PRESETS } from "./denial-presets";

export function approveUpdate(adminId: string) {
  return {
    review_status: "approved" as const, is_approved: true,
    reviewed_by: adminId, reviewed_at: new Date().toISOString(),
    denial_reason: null, denial_note: null, denial_fix: null, denied_at: null,
  };
}

export function denyUpdate(adminId: string, presetKey: keyof typeof DENIAL_PRESETS, note?: string) {
  const preset = DENIAL_PRESETS[presetKey];
  return {
    review_status: "denied" as const, is_approved: false,
    reviewed_by: adminId, reviewed_at: new Date().toISOString(),
    denial_reason: presetKey, denial_note: note?.trim() || null,
    denial_fix: preset.fix, denied_at: new Date().toISOString(),
  };
}

export function resubmitUpdate() {
  return {
    review_status: "pending" as const,
    denial_reason: null, denial_note: null, denial_fix: null, denied_at: null,
  };
}
