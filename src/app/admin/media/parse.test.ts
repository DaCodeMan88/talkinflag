import { describe, it, expect } from "vitest";
import { parseCount, describeUnparsableInstagramUrl } from "./parse";

describe("parseCount", () => {
  it("reads a plain number", () => {
    expect(parseCount("20400")).toBe(20400);
  });

  it("reads grouped thousands, with either separator or spaces", () => {
    expect(parseCount("1,234")).toBe(1234);
    expect(parseCount("1.234")).toBe(1234);
    expect(parseCount(" 8 500 ")).toBe(8500);
    expect(parseCount("1,234,567")).toBe(1234567);
  });

  it("expands the K/M shorthand Instagram Insights actually shows", () => {
    expect(parseCount("20.4K")).toBe(20400);
    expect(parseCount("20.4k")).toBe(20400);
    expect(parseCount("8.5K")).toBe(8500);
    expect(parseCount("2K")).toBe(2000);
    expect(parseCount("1.2M")).toBe(1200000);
    expect(parseCount("1.2m")).toBe(1200000);
    expect(parseCount("1.5 K")).toBe(1500);
  });

  it("keeps two decimals of a shorthand rather than truncating", () => {
    expect(parseCount("20.45K")).toBe(20450);
    // Rounds to a whole count — a fraction of a play is not a thing.
    expect(parseCount("1.2345K")).toBe(1235);
  });

  it("accepts a whole label pasted in, suffix or not", () => {
    // She may well paste "20.4K likes" straight off the app.
    expect(parseCount("20.4K likes")).toBe(20400);
    expect(parseCount("20400 plays")).toBe(20400);
  });

  it("is null for blank, missing and non-numeric input", () => {
    expect(parseCount("")).toBeNull();
    expect(parseCount("   ")).toBeNull();
    expect(parseCount(undefined)).toBeNull();
    expect(parseCount("abc")).toBeNull();
    expect(parseCount("K")).toBeNull();
  });

  it("refuses malformed numbers instead of inventing a value", () => {
    expect(parseCount("1.2.3")).toBeNull();
    // A bare decimal with no suffix is not a count: 20.4 plays means nothing,
    // and guessing 204 or 20 would both be wrong.
    expect(parseCount("20.4")).toBeNull();
    expect(parseCount("1,23")).toBeNull();
    // A leading minus is rejected rather than silently losing its sign.
    expect(parseCount("-5")).toBeNull();
    expect(parseCount("20.4KM")).toBeNull();
  });
});

describe("describeUnparsableInstagramUrl", () => {
  it("explains an app Share-button link, which carries a token and not a shortcode", () => {
    for (const url of [
      "https://www.instagram.com/share/reel/BAgH7xQpLm/",
      "https://instagram.com/share/p/BAgH7xQpLm/",
      "instagram.com/share/BAgH7xQpLm",
      "https://www.instagram.com/share/reel/BAgH7xQpLm/?igsh=abc123",
    ]) {
      const msg = describeUnparsableInstagramUrl(url);
      expect(msg, url).toBeTruthy();
      expect(msg, url).toMatch(/share links/i);
      expect(msg, url).toMatch(/URL bar/i);
    }
  });

  it("explains a profile-prefixed reel link", () => {
    const msg = describeUnparsableInstagramUrl(
      "https://www.instagram.com/talkinflag/reel/DKULB7cNxpR/"
    );
    expect(msg).toBeTruthy();
    expect(msg).toMatch(/instagram\.com\/reel\//);
  });

  it("only matches instagram.com itself, not a lookalike host", () => {
    expect(
      describeUnparsableInstagramUrl("https://evil.example.com/instagram.com/share/reel/X/")
    ).toBeNull();
    expect(
      describeUnparsableInstagramUrl("https://notinstagram.com/share/reel/X/")
    ).toBeNull();
  });

  it("is null for links the parser can already read, so they keep the generic path", () => {
    expect(describeUnparsableInstagramUrl("https://www.instagram.com/reel/DKULB7cNxpR/")).toBeNull();
    expect(describeUnparsableInstagramUrl("https://www.instagram.com/p/DKULB7cNxpR/")).toBeNull();
    expect(describeUnparsableInstagramUrl("DKULB7cNxpR")).toBeNull();
    expect(describeUnparsableInstagramUrl("")).toBeNull();
    expect(describeUnparsableInstagramUrl("https://youtube.com/watch?v=abc")).toBeNull();
  });

  it("does not claim a bare profile URL is a share link", () => {
    expect(describeUnparsableInstagramUrl("https://www.instagram.com/talkinflag/")).toBeNull();
  });
});
