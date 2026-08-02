import { describe, it, expect } from "vitest";
import {
  mergePostsBySlug,
  toPostRecordFromStatic,
  toPostRecordFromDb,
  parseJsonArray,
} from "./posts";
import type { StaticPost } from "@/lib/static-posts";

describe("mergePostsBySlug", () => {
  it("dedupes by slug with DB winning over static", () => {
    const db = [{ slug: "a", title: "DB A", publishedAt: "2026-02-01" } as any];
    const stat = [
      { slug: "a", title: "Static A", publishedAt: "2026-01-01" } as any,
      { slug: "b", title: "Static B", publishedAt: "2026-01-02" } as any,
    ];
    const merged = mergePostsBySlug(db, stat);
    expect(merged.find((p) => p.slug === "a")!.title).toBe("DB A");
    expect(merged).toHaveLength(2);
  });

  it("sorts newest first by publishedAt", () => {
    const merged = mergePostsBySlug(
      [{ slug: "new", publishedAt: "2026-03-01" } as any],
      [{ slug: "old", publishedAt: "2026-01-01" } as any]
    );
    expect(merged.map((p) => p.slug)).toEqual(["new", "old"]);
  });
});

describe("toPostRecordFromStatic", () => {
  it("maps a StaticPost to a PostRecord with source 'static'", () => {
    const staticPost: StaticPost = {
      slug: "positions-guide",
      title: "Positions Guide",
      author: "Talkin Flag",
      publishedAt: "2026-01-01T00:00:00Z",
      category: "Coaching",
      excerpt: "An excerpt",
      body: "Body text here",
      faqItems: [{ q: "Q1?", a: "A1." }],
      isStatic: true,
    };
    const rec = toPostRecordFromStatic(staticPost);
    expect(rec.source).toBe("static");
    expect(rec.slug).toBe("positions-guide");
    expect(rec.title).toBe("Positions Guide");
    expect(rec.body).toBe("Body text here");
    expect(rec.faqItems).toEqual([{ q: "Q1?", a: "A1." }]);
    expect(rec.publishedAt).toBe("2026-01-01T00:00:00Z");
  });
});

describe("parseJsonArray", () => {
  it("returns a real array unchanged", () => {
    expect(parseJsonArray(["x", "y"])).toEqual(["x", "y"]);
  });
  it("parses a JSON-string array", () => {
    expect(parseJsonArray('["x","y"]')).toEqual(["x", "y"]);
  });
  it("returns [] for null and undefined", () => {
    expect(parseJsonArray(null)).toEqual([]);
    expect(parseJsonArray(undefined)).toEqual([]);
  });
  it("returns [] for an unparseable string or non-array value", () => {
    expect(parseJsonArray("not json")).toEqual([]);
    expect(parseJsonArray(42)).toEqual([]);
    expect(parseJsonArray('{"a":1}')).toEqual([]);
  });
});

describe("toPostRecordFromDb", () => {
  it("maps a full DB row to a camelCase PostRecord with source 'db'", () => {
    const row = {
      slug: "db-post",
      title: "DB Post",
      author: "Ambra",
      category: "International",
      excerpt: "An excerpt",
      body: "Body",
      cover_image_url: "https://x/cover.jpg",
      cover_image_alt: "Cover alt",
      seo_title: "SEO Title",
      seo_description: "SEO Desc",
      og_image_url: "https://x/og.jpg",
      key_takeaways: ["one", "two"],
      faq_items: [{ q: "Q?", a: "A." }],
      published_at: "2026-02-01T00:00:00Z",
      status: "published",
    };
    const rec = toPostRecordFromDb(row as any);
    expect(rec).toMatchObject({
      slug: "db-post",
      title: "DB Post",
      author: "Ambra",
      category: "International",
      excerpt: "An excerpt",
      body: "Body",
      coverImageUrl: "https://x/cover.jpg",
      coverImageAlt: "Cover alt",
      seoTitle: "SEO Title",
      seoDescription: "SEO Desc",
      ogImageUrl: "https://x/og.jpg",
      keyTakeaways: ["one", "two"],
      faqItems: [{ q: "Q?", a: "A." }],
      publishedAt: "2026-02-01T00:00:00Z",
      source: "db",
    });
  });

  it("applies fallbacks for an all-nulls row", () => {
    const row = {
      slug: "bare",
      title: "Bare",
      author: null,
      category: null,
      excerpt: null,
      body: null,
      cover_image_url: null,
      cover_image_alt: null,
      seo_title: null,
      seo_description: null,
      og_image_url: null,
      key_takeaways: null,
      faq_items: null,
      published_at: null,
    };
    const rec = toPostRecordFromDb(row as any);
    expect(rec.author).toBe("Talkin Flag");
    expect(rec.category).toBe("");
    expect(rec.excerpt).toBe("");
    expect(rec.body).toBe("");
    expect(rec.publishedAt).toBe("");
    expect(rec.coverImageUrl).toBeUndefined();
    expect(rec.coverImageAlt).toBeUndefined();
    expect(rec.seoTitle).toBeUndefined();
    expect(rec.seoDescription).toBeUndefined();
    expect(rec.ogImageUrl).toBeUndefined();
    // null JSONB columns → []
    expect(rec.keyTakeaways).toEqual([]);
    expect(rec.faqItems).toEqual([]);
    expect(rec.source).toBe("db");
  });

  it("parses key_takeaways / faq_items supplied as JSON strings", () => {
    const row = {
      slug: "stringified",
      title: "Stringified",
      author: "Talkin Flag",
      category: "Coaching",
      excerpt: "",
      body: "",
      cover_image_url: null,
      cover_image_alt: null,
      seo_title: null,
      seo_description: null,
      og_image_url: null,
      key_takeaways: '["a","b"]',
      faq_items: '[{"q":"Q?","a":"A."}]',
      published_at: "2026-01-01T00:00:00Z",
    };
    const rec = toPostRecordFromDb(row as any);
    expect(rec.keyTakeaways).toEqual(["a", "b"]);
    expect(rec.faqItems).toEqual([{ q: "Q?", a: "A." }]);
  });
});
