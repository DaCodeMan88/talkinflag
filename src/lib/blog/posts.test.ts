import { describe, it, expect } from "vitest";
import { mergePostsBySlug, toPostRecordFromStatic } from "./posts";
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
