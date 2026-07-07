import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Static guard for the July stress-test regression where submission routes
 * either never attempted to email or did so silently. Each public submission
 * route must wire up an email path (admin notification and/or submitter
 * confirmation). This is intentionally a cheap source scan — full route tests
 * with a mocked Resend client are heavier and add little over this contract.
 *
 * If a route legitimately stops sending email, update this list deliberately.
 */
const APP_DIR = join(__dirname, "..", "app");

const ROUTES_THAT_MUST_EMAIL: { file: string; expect: RegExp }[] = [
  // Contact: admin copy (sendEmail) + submitter confirmation.
  { file: "api/contact/route.ts", expect: /confirmationEmailHtml/ },
  // Player self-submission: admin notify (notifyAdmins) + submitter confirmation.
  { file: "api/players/submit/route.ts", expect: /confirmationEmailHtml/ },
  // Event submission: admin notify + optional submitter confirmation.
  { file: "api/events/submit/route.ts", expect: /notifyAdmins|confirmationEmailHtml/ },
  // Scout application: admin notify + applicant confirmation.
  { file: "api/scouts/apply/route.ts", expect: /confirmationEmailHtml/ },
];

describe("submission routes wire up an email path", () => {
  for (const { file, expect: pattern } of ROUTES_THAT_MUST_EMAIL) {
    it(`${file} sends email`, () => {
      const src = readFileSync(join(APP_DIR, file), "utf8");
      expect(src).toMatch(/sendEmail|notifyAdmins/);
      expect(src).toMatch(pattern);
    });
  }
});

describe("sendEmail returns a result and fails loudly", () => {
  it("sendEmail returns a result object and never silently console.warn-skips", () => {
    const src = readFileSync(join(__dirname, "email.ts"), "utf8");
    // Returns a typed result rather than void.
    expect(src).toMatch(/SendEmailResult/);
    // The missing-key path logs at error level (loud), not warn (silent).
    expect(src).toMatch(/console\.error\([^)]*RESEND_API_KEY/);
    expect(src).not.toMatch(/console\.warn\([^)]*RESEND_API_KEY/);
  });
});
