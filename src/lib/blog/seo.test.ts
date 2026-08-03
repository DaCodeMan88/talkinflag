import { describe, it, expect } from "vitest";
import {
  slugify,
  autoMetaDescription,
  autoSeoTitle,
  keyTakeawaysSuggestion,
  seoChecklist,
} from "./seo";

describe("slugify", () => {
  it("makes a clean url slug", () => {
    expect(slugify("Katherine Sowers: What's Next?!")).toBe(
      "katherine-sowers-whats-next"
    );
  });

  it("collapses whitespace and trims dashes", () => {
    expect(slugify("  Hello   World  ")).toBe("hello-world");
    expect(slugify("--Already--Dashed--")).toBe("already-dashed");
  });

  it("returns empty string for punctuation-only input", () => {
    expect(slugify("!?:.")).toBe("");
  });
});

describe("autoMetaDescription", () => {
  it("trims to <=160 chars on a word boundary", () => {
    const d = autoMetaDescription("a ".repeat(200));
    expect(d.length).toBeLessThanOrEqual(160);
    expect(d.endsWith(" ")).toBe(false);
  });

  it("strips markdown-lite markers", () => {
    const d = autoMetaDescription(
      "**Bold** intro with a [link](/players) and\n- a bullet\n## Heading"
    );
    expect(d).not.toContain("**");
    expect(d).not.toContain("](");
    expect(d).not.toContain("#");
    expect(d).toContain("link");
  });

  it("returns short text unchanged (no trailing ellipsis needed)", () => {
    expect(autoMetaDescription("A short description.")).toBe(
      "A short description."
    );
  });
});

describe("autoSeoTitle", () => {
  it("returns a short title unchanged", () => {
    const t = "A tight, keyword-rich flag football title";
    expect(autoSeoTitle(t)).toBe(t);
  });

  it("trims an overlong title to a word boundary <=60", () => {
    const t = autoSeoTitle("word ".repeat(40));
    expect(t.length).toBeLessThanOrEqual(60);
    expect(t.endsWith(" ")).toBe(false);
  });
});

describe("keyTakeawaysSuggestion", () => {
  it("returns [] for empty body", () => {
    expect(keyTakeawaysSuggestion("")).toEqual([]);
  });

  it("extracts first sentences of the first paragraphs", () => {
    const body =
      "First para first sentence. More of first para.\n\nSecond para first sentence. More.\n\nThird one here. Extra.";
    const r = keyTakeawaysSuggestion(body);
    expect(r.length).toBeGreaterThan(0);
    expect(r[0]).toBe("First para first sentence.");
  });
});

describe("seoChecklist", () => {
  it("flags a title over 60 chars, missing meta, no cover, no internal links, no FAQ", () => {
    const r = seoChecklist({
      title: "x".repeat(70),
      seoDescription: "",
      body: "no links here",
      coverImageUrl: null,
      faqItems: [],
      keyTakeaways: [],
    });
    const ids = r.filter((c) => !c.pass).map((c) => c.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "title-length",
        "meta-description",
        "cover-image",
        "internal-links",
        "faq",
        "key-takeaways",
      ])
    );
  });

  it("passes a well-formed post", () => {
    const r = seoChecklist({
      title: "A tight, keyword-rich flag football title",
      seoDescription:
        "A crisp 120-character description about flag football coaching and what it means for the women's game today.",
      body: "See our [rankings](/players) and [Italy piece](/blog/italy).",
      coverImageUrl: "x.jpg",
      faqItems: [{ q: "?", a: "!" }],
      keyTakeaways: ["one", "two", "three"],
    });
    expect(r.every((c) => c.pass)).toBe(true);
  });

  it("returns items each with id, label, pass, hint", () => {
    const r = seoChecklist({
      title: "t",
      seoDescription: "",
      body: "",
      coverImageUrl: null,
      faqItems: [],
      keyTakeaways: [],
    });
    for (const c of r) {
      expect(typeof c.id).toBe("string");
      expect(typeof c.label).toBe("string");
      expect(typeof c.pass).toBe("boolean");
      expect(typeof c.hint).toBe("string");
    }
  });
});
