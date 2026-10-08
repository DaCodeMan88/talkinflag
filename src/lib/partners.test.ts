import { describe, expect, it } from "vitest";
import { FALLBACK_PARTNERS, isPartnerUrl, selectLivePartners } from "./partners";

describe("isPartnerUrl", () => {
  it("accepts absolute http(s) links", () => {
    expect(isPartnerUrl("https://flagfootballfinder.com")).toBe(true);
    expect(isPartnerUrl("http://example.com/path")).toBe(true);
  });

  it("rejects anything a browser would not open as a site", () => {
    expect(isPartnerUrl("flagfootballfinder.com")).toBe(false);
    expect(isPartnerUrl("javascript:alert(1)")).toBe(false);
    expect(isPartnerUrl("")).toBe(false);
  });
});

describe("selectLivePartners", () => {
  it("drops hidden partners and bad links, and orders by position", () => {
    const rows = [
      { name: "B", url: "https://b.com", position: 1, is_live: true },
      { name: "Hidden", url: "https://h.com", position: 0, is_live: false },
      { name: "Broken", url: "not a url", position: 0, is_live: true },
      { name: "A", url: "https://a.com", position: 0, is_live: true },
    ];
    expect(selectLivePartners(rows).map((p) => p.name)).toEqual(["A", "B"]);
  });
});

describe("FALLBACK_PARTNERS", () => {
  it("no longer lists Athleads (Ambra 2026-10-07)", () => {
    expect(FALLBACK_PARTNERS.map((p) => p.name)).not.toContain("Athleads");
  });
});
