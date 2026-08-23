import { describe, it, expect } from "vitest";
import {
  pendingReceivedEmail, approvedLiveEmail, claimApprovedEmail, claimReceivedEmail, deniedEmail,
  accountDeletedEmail, changeRequestDecidedEmail, claimReleasedEmail,
} from "./lifecycle";
import type { LifecycleEmail } from "./lifecycle";

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

describe("claimReceivedEmail", () => {
  it("tells the claimant it is with a human and that editing is locked until then", () => {
    const e = claimReceivedEmail("Aleena");
    expect(e.subject).toMatch(/claim/i);
    expect(e.html).toContain("Aleena");
    expect(e.html).toMatch(/review/i);
    expect(e.html).toMatch(/edit/i);
  });

  it("greets without a name when none is known", () => {
    expect(claimReceivedEmail("").html).not.toContain("Hi ,");
  });
});

describe("accountDeletedEmail", () => {
  it("states what was removed and gives a contact route", () => {
    const e = accountDeletedEmail("Aleena");
    expect(e.subject).toMatch(/account/i);
    expect(e.html).toMatch(/removed|deleted/i);
    expect(e.html).toContain("talkinflag.com/contact");
  });

  it("greets without a name when none is known", () => {
    expect(accountDeletedEmail("").html).not.toContain("Hi ,");
  });
});

describe("changeRequestDecidedEmail", () => {
  it("names the field and reads as approved when approved", () => {
    const e = changeRequestDecidedEmail("Aleena", "jersey_number", true);
    expect(e.html).toContain("Aleena");
    expect(e.html).toContain("jersey_number");
    expect(e.html).toMatch(/approved|applied|updated/i);
    expect(e.subject).toMatch(/change|update|request/i);
  });

  it("reads differently when rejected", () => {
    const approved = changeRequestDecidedEmail("Aleena", "jersey_number", true);
    const rejected = changeRequestDecidedEmail("Aleena", "jersey_number", false);
    expect(rejected.html).not.toEqual(approved.html);
    expect(rejected.html).toContain("jersey_number");
    expect(rejected.html).toMatch(/not applied|no change|unchanged/i);
    expect(rejected.html).toContain("talkinflag.com/contact");
  });

  it("surfaces an admin note when one is given", () => {
    const e = changeRequestDecidedEmail("Aleena", "position", false, "we could not verify that");
    expect(e.html).toContain("we could not verify that");
  });

  it("does not claim a reason was given when the note is absent", () => {
    const e = changeRequestDecidedEmail("Aleena", "position", false);
    expect(e.html).not.toMatch(/note from our team|reason given|see below/i);
  });

  it("greets without a name when none is known", () => {
    expect(changeRequestDecidedEmail("", "position", true).html).not.toContain("Hi ,");
  });
});

describe("claimReleasedEmail", () => {
  it("says the profile is no longer linked and gives a contact route", () => {
    const e = claimReleasedEmail("Aleena");
    expect(e.html).toContain("Aleena");
    expect(e.html).toMatch(/no longer linked/i);
    expect(e.html).toContain("talkinflag.com/contact");
    expect(e.subject).toMatch(/profile|claim/i);
  });

  it("neither accuses nor apologises — it may be routine or a report outcome", () => {
    const e = claimReleasedEmail("Aleena");
    expect(e.html.toLowerCase()).not.toMatch(/fraud|false|wrongly|violation|misuse|sorry|apolog/);
    expect(e.subject.toLowerCase()).not.toMatch(/sorry|apolog|violation/);
  });

  it("greets without a name when none is known", () => {
    expect(claimReleasedEmail("").html).not.toContain("Hi ,");
  });
});

// A missing first name used to render a literal "Hi , " in half these templates.
// Written as a loop so a new template can't quietly reintroduce it.
describe("every lifecycle template handles a missing first name", () => {
  const templates: Record<string, (n: string) => LifecycleEmail> = {
    pendingReceivedEmail,
    approvedLiveEmail,
    claimReceivedEmail,
    claimApprovedEmail,
    accountDeletedEmail,
    deniedEmail: (n) => deniedEmail(n, "highlight_broken"),
    claimReleasedEmail,
    changeRequestDecidedEmailApproved: (n) => changeRequestDecidedEmail(n, "position", true),
    changeRequestDecidedEmailRejected: (n) => changeRequestDecidedEmail(n, "position", false),
  };

  for (const [name, build] of Object.entries(templates)) {
    it(`${name} does not emit an empty greeting`, () => {
      const { html } = build("");
      expect(html).not.toContain("Hi ,");
      expect(html).not.toMatch(/\b(Hi|Thanks)\s*[,—]/);
    });
  }
});
