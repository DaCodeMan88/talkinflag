import { describe, it, expect } from "vitest";
import { suggestInternalLinks } from "./links";

describe("suggestInternalLinks", () => {
  it("detects an unlinked mention of a post title", () => {
    const body = "We covered the History of Flag Football in depth last week.";
    const out = suggestInternalLinks(body, {
      posts: [{ title: "History of Flag Football", href: "/blog/history-of-flag-football" }],
      players: [],
    });
    expect(out).toEqual([
      {
        text: "History of Flag Football",
        href: "/blog/history-of-flag-football",
        reason: "Links to related post",
      },
    ]);
  });

  it("ignores a mention that is already inside a markdown link", () => {
    const body = "Read [History of Flag Football](/blog/history-of-flag-football) now.";
    const out = suggestInternalLinks(body, {
      posts: [{ title: "History of Flag Football", href: "/blog/history-of-flag-football" }],
      players: [],
    });
    expect(out).toEqual([]);
  });

  it("ranks exact/longer matches first", () => {
    const body = "Flag Football and the History of Flag Football are both great.";
    const out = suggestInternalLinks(body, {
      posts: [
        { title: "Flag Football", href: "/blog/flag-football" },
        { title: "History of Flag Football", href: "/blog/history-of-flag-football" },
      ],
      players: [],
    });
    // Longer title ranks first
    expect(out[0].text).toBe("History of Flag Football");
    expect(out.map((s) => s.href)).toContain("/blog/flag-football");
  });

  it("detects a player name and links to the player profile", () => {
    const body = "Nobody covers the game like Ambra Marcucci does.";
    const out = suggestInternalLinks(body, {
      posts: [],
      players: [{ title: "Ambra Marcucci", href: "/players/abc-123" }],
    });
    expect(out).toEqual([
      {
        text: "Ambra Marcucci",
        href: "/players/abc-123",
        reason: "Links to player profile",
      },
    ]);
  });

  it("returns [] when nothing matches", () => {
    const body = "This body mentions nobody and no posts at all.";
    const out = suggestInternalLinks(body, {
      posts: [{ title: "Rankings Explained", href: "/blog/rankings" }],
      players: [{ title: "Tika Doe", href: "/players/xyz" }],
    });
    expect(out).toEqual([]);
  });

  it("is case-insensitive on matching but preserves the body casing", () => {
    const body = "we love FLAG FOOTBALL around here.";
    const out = suggestInternalLinks(body, {
      posts: [{ title: "Flag Football", href: "/blog/flag-football" }],
      players: [],
    });
    expect(out).toEqual([
      { text: "FLAG FOOTBALL", href: "/blog/flag-football", reason: "Links to related post" },
    ]);
  });

  it("de-dups the same text -> href suggestion", () => {
    const body = "Ambra Marcucci is great. Ambra Marcucci again.";
    const out = suggestInternalLinks(body, {
      posts: [],
      players: [{ title: "Ambra Marcucci", href: "/players/abc-123" }],
    });
    expect(out).toHaveLength(1);
  });
});
