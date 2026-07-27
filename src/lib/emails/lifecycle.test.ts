import { describe, it, expect } from "vitest";
import {
  pendingReceivedEmail, approvedLiveEmail, claimApprovedEmail, deniedEmail,
} from "./lifecycle";

describe("lifecycle emails", () => {
  it("pending-received names the athlete and sets expectation", () => {
    const e = pendingReceivedEmail("Maya");
    expect(e.subject).toMatch(/pending|review/i);
    expect(e.html).toContain("Maya");
  });
  it("approved-live links to the dashboard", () => {
    expect(approvedLiveEmail("Maya").html).toContain("talkinflag.com/dashboard");
  });
  it("denied email is encouraging: reason + fix + resubmit + still-a-fan", () => {
    const e = deniedEmail("Maya", "highlight_broken", "loved your energy");
    expect(e.html).toContain("Maya");
    expect(e.html.toLowerCase()).toContain("highlight"); // the fix
    expect(e.html).toMatch(/dashboard\/edit|resubmit/i);   // clear next step
    expect(e.html.toLowerCase()).not.toMatch(/rejected|denied|failed/); // tone
    expect(e.html).toContain("loved your energy"); // admin note surfaced
    expect(e.subject.toLowerCase()).not.toMatch(/rejected|denied/);
  });
});
