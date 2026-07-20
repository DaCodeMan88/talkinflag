import { describe, it, expect } from "vitest";
import { isEligibleForAutoNudge, nudgeEmailHtml, NUDGE_MIN_AGE_DAYS } from "./nudge";

describe("isEligibleForAutoNudge", () => {
  // A post-launch, email-confirmed signup that is 12 days old and 40% complete.
  const base = {
    ageDays: 12,
    completionPct: 40,
    alreadyAutoNudged: false,
    emailConfirmed: true,
    createdAt: "2026-08-01T00:00:00.000Z",
  };
  it("nudges an incomplete 12-day-old user", () => {
    expect(isEligibleForAutoNudge(base)).toBe(true);
  });
  it("skips users younger than 10 days", () => {
    expect(isEligibleForAutoNudge({ ...base, ageDays: 9 })).toBe(false);
  });
  it("includes users with no profile (0% / null)", () => {
    expect(isEligibleForAutoNudge({ ...base, completionPct: 0 })).toBe(true);
  });
  it("skips users at or above 75%", () => {
    expect(isEligibleForAutoNudge({ ...base, completionPct: 75 })).toBe(false);
  });
  it("skips users already auto-nudged", () => {
    expect(isEligibleForAutoNudge({ ...base, alreadyAutoNudged: true })).toBe(false);
  });
  it("skips dormant accounts older than the max window", () => {
    expect(isEligibleForAutoNudge({ ...base, ageDays: 46 })).toBe(false);
  });
  it("never emails an unconfirmed address", () => {
    expect(isEligibleForAutoNudge({ ...base, emailConfirmed: false })).toBe(false);
  });
  it("never emails the pre-launch backlog", () => {
    expect(isEligibleForAutoNudge({ ...base, createdAt: "2026-07-01T00:00:00.000Z" })).toBe(false);
  });
  it("exposes the day-10 threshold", () => {
    expect(NUDGE_MIN_AGE_DAYS).toBe(10);
  });
});

describe("nudgeEmailHtml", () => {
  it("greets by first name and links to the dashboard", () => {
    const html = nudgeEmailHtml("Tristan");
    expect(html).toContain("Tristan");
    expect(html).toContain("/dashboard");
  });
  it("falls back gracefully with no name", () => {
    expect(nudgeEmailHtml(null)).toContain("there");
  });
});
