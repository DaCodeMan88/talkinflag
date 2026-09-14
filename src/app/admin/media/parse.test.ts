import { describe, it, expect } from "vitest";
import { toInt, describeUnparsableInstagramUrl } from "./parse";

describe("toInt", () => {
  it("reads a plain number", () => {
    expect(toInt("20400")).toBe(20400);
  });

  it("strips thousands separators", () => {
    expect(toInt("1,234")).toBe(1234);
    expect(toInt("1.234")).toBe(1234);
    expect(toInt(" 8 500 ")).toBe(8500);
  });

  it("treats an abbreviated count as its digits only — 20.4K is NOT 20400", () => {
    // Documented, deliberate limitation: every non-digit is stripped, so the
    // shorthand Instagram Insights displays reads as 204, not 20,400. The admin
    // form's helper text must ask for the full number.
    expect(toInt("20.4K")).toBe(204);
    expect(toInt("8.5k")).toBe(85);
  });

  it("loses the sign on a negative, rather than storing one", () => {
    expect(toInt("-5")).toBe(5);
  });

  it("is null for blank, missing and non-numeric input", () => {
    expect(toInt("")).toBeNull();
    expect(toInt("   ")).toBeNull();
    expect(toInt(undefined)).toBeNull();
    expect(toInt("abc")).toBeNull();
    expect(toInt("K")).toBeNull();
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
