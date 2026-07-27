import { describe, it, expect } from "vitest";
import { DENIAL_PRESETS, isDenialPreset } from "./denial-presets";
import { approveUpdate, denyUpdate, resubmitUpdate } from "./transitions";

describe("denial presets", () => {
  it("every preset has an encouraging reason + concrete fix", () => {
    for (const p of Object.values(DENIAL_PRESETS)) {
      expect(p.reason.length).toBeGreaterThan(10);
      expect(p.fix.length).toBeGreaterThan(10);
      // fan-retaining tone: no harsh words
      expect(p.reason.toLowerCase()).not.toMatch(/reject|denied|failed|invalid/);
    }
  });
  it("validates preset keys", () => {
    expect(isDenialPreset("highlight_broken")).toBe(true);
    expect(isDenialPreset("nope")).toBe(false);
  });
});

describe("review transitions", () => {
  it("approve sets approved + publicly live", () => {
    expect(approveUpdate("admin-1")).toMatchObject({
      review_status: "approved", is_approved: true, denial_reason: null,
    });
  });
  it("deny stores reason/fix, hides publicly, is recoverable", () => {
    const u = denyUpdate("admin-1", "highlight_broken", "extra note");
    expect(u.review_status).toBe("denied");
    expect(u.is_approved).toBe(false);
    expect(u.denial_reason).toBe("highlight_broken");
    expect(u.denial_note).toBe("extra note");
    expect(u.denial_fix).toContain("highlight"); // rendered from preset
  });
  it("resubmit returns a denied profile to pending and clears denial", () => {
    expect(resubmitUpdate()).toMatchObject({
      review_status: "pending", denial_reason: null, denied_at: null,
    });
  });
});
