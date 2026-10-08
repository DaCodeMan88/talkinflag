import { describe, expect, it } from "vitest";
import { eventPath, eventUrl, isPastEvent, isUuid } from "./path";

describe("eventPath", () => {
  it("prefers the slug", () => {
    expect(eventPath({ id: "33e767b6-f069-4c3d-8a87-ce29b821a85e", slug: "european-flag-football-championship-2026" }))
      .toBe("/events/european-flag-football-championship-2026");
  });

  it("falls back to the id when the slug is missing or empty", () => {
    expect(eventPath({ id: "abc" })).toBe("/events/abc");
    expect(eventPath({ id: "abc", slug: "" })).toBe("/events/abc");
    expect(eventPath({ id: "abc", slug: null })).toBe("/events/abc");
  });

  it("builds an absolute URL on the live domain", () => {
    expect(eventUrl({ id: "x", slug: "adria-bowl-2027" })).toBe("https://talkinflag.com/events/adria-bowl-2027");
  });
});

describe("isUuid", () => {
  it("accepts a UUID and rejects a slug", () => {
    expect(isUuid("33e767b6-f069-4c3d-8a87-ce29b821a85e")).toBe(true);
    expect(isUuid("adria-bowl-2027")).toBe(false);
    // A slug can contain dashes and hex-looking words; it must still not pass.
    expect(isUuid("deadbeef-face-cafe-babe-decaf-2026")).toBe(false);
  });
});

describe("isPastEvent", () => {
  it("stays upcoming until the last day is over", () => {
    const euro = { start_date: "2026-09-05", end_date: "2026-09-13" };
    expect(isPastEvent(euro, "2026-09-10")).toBe(false);
    expect(isPastEvent(euro, "2026-09-13")).toBe(false);
    expect(isPastEvent(euro, "2026-09-14")).toBe(true);
  });

  it("uses start_date for a one-day event", () => {
    expect(isPastEvent({ start_date: "2026-02-12", end_date: null }, "2026-02-13")).toBe(true);
    expect(isPastEvent({ start_date: "2026-02-12" }, "2026-02-12")).toBe(false);
  });
});
