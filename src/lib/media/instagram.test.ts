import { describe, it, expect } from "vitest";
import { parseInstagramShortcode, selectGridPosts, MAX_LIVE_POSTS } from "./instagram";

describe("parseInstagramShortcode", () => {
  it("parses a reel URL", () => {
    expect(parseInstagramShortcode("https://www.instagram.com/reel/DKULB7cNxpR/")).toBe("DKULB7cNxpR");
  });

  it("parses a /reels/ URL", () => {
    expect(parseInstagramShortcode("https://instagram.com/reels/DKULB7cNxpR")).toBe("DKULB7cNxpR");
  });

  it("parses a regular post URL", () => {
    expect(parseInstagramShortcode("https://www.instagram.com/p/DHHVMyKN9Qw/")).toBe("DHHVMyKN9Qw");
  });

  it("strips share/tracking query params", () => {
    expect(
      parseInstagramShortcode("https://www.instagram.com/reel/DZIWIHgt8bq/?igsh=abc123&utm_source=ig_web")
    ).toBe("DZIWIHgt8bq");
  });

  it("accepts a bare shortcode pasted on its own", () => {
    expect(parseInstagramShortcode("DZNRMgSDZOs")).toBe("DZNRMgSDZOs");
  });

  it("trims surrounding whitespace", () => {
    expect(parseInstagramShortcode("  https://www.instagram.com/reel/DY2T9iytnox/  ")).toBe("DY2T9iytnox");
  });

  it("returns null for a non-Instagram URL", () => {
    expect(parseInstagramShortcode("https://youtube.com/watch?v=abc")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(parseInstagramShortcode("")).toBeNull();
  });

  it("returns null for an Instagram profile URL with no post", () => {
    expect(parseInstagramShortcode("https://www.instagram.com/talkinflagshow/")).toBeNull();
  });
});

describe("selectGridPosts", () => {
  const row = (shortcode: string, position: number, is_live = true) => ({
    shortcode,
    label: "",
    position,
    is_live,
  });

  it("returns live posts in position order", () => {
    const out = selectGridPosts([row("c", 2), row("a", 0), row("b", 1)]);
    expect(out.map((p) => p.shortcode)).toEqual(["a", "b", "c"]);
  });

  it("drops retired posts", () => {
    const out = selectGridPosts([row("a", 0), row("dead", 1, false), row("b", 2)]);
    expect(out.map((p) => p.shortcode)).toEqual(["a", "b"]);
  });

  it("caps the grid at 9 even if the table has more live rows", () => {
    const rows = Array.from({ length: 12 }, (_, i) => row(`s${i}`, i));
    expect(selectGridPosts(rows)).toHaveLength(MAX_LIVE_POSTS);
    expect(MAX_LIVE_POSTS).toBe(9);
  });

  it("breaks a position tie deterministically by shortcode", () => {
    const out = selectGridPosts([row("zzz", 0), row("aaa", 0)]);
    expect(out.map((p) => p.shortcode)).toEqual(["aaa", "zzz"]);
  });

  it("returns [] for an empty table", () => {
    expect(selectGridPosts([])).toEqual([]);
  });
});
