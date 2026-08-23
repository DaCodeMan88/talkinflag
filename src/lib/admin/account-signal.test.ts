import { describe, it, expect } from "vitest";
import { accountSignal } from "./account-signal";

const base = {
  provider: "google", evals: 0, sessions: 0, drafts: 0,
  hasPlayer: false, hasCoach: false, nudges: 0,
  emailConfirmed: true,
  createdAt: "2026-06-01T00:00:00Z", now: new Date("2026-08-23T00:00:00Z"),
};

describe("accountSignal", () => {
  it("calls any evidence of work 'active'", () => {
    expect(accountSignal({ ...base, drafts: 1 }).level).toBe("active");
    expect(accountSignal({ ...base, evals: 1 }).level).toBe("active");
    expect(accountSignal({ ...base, sessions: 1 }).level).toBe("active");
  });

  it("calls a linked profile 'active' even with no other activity", () => {
    expect(accountSignal({ ...base, hasCoach: true }).level).toBe("active");
    expect(accountSignal({ ...base, hasPlayer: true }).level).toBe("active");
  });

  it("holds an account under 14 days old as 'new', never 'empty'", () => {
    expect(accountSignal({ ...base, createdAt: "2026-08-20T00:00:00Z" }).level).toBe("new");
  });

  it("calls an old, activity-free, already-nudged account 'empty'", () => {
    expect(accountSignal({ ...base, nudges: 1 }).level).toBe("empty");
  });

  it("never returns 'spam' for an OAuth account - Google already proved a human", () => {
    expect(accountSignal({ ...base, nudges: 3 }).level).not.toBe("spam");
  });

  it("reaches 'spam' only for a non-OAuth account with an unconfirmed email", () => {
    expect(accountSignal({ ...base, provider: "email", emailConfirmed: false }).level).toBe("spam");
    expect(accountSignal({ ...base, provider: "email", emailConfirmed: true }).level).toBe("empty");
  });

  it("gives a reason string for every level", () => {
    for (const o of [{ drafts: 1 }, { createdAt: "2026-08-22T00:00:00Z" }, { nudges: 1 }]) {
      expect(accountSignal({ ...base, ...o }).reason).toBeTruthy();
    }
  });
});
