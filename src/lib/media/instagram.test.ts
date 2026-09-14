import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  parseInstagramShortcode,
  selectGridPosts,
  MAX_LIVE_POSTS,
  FALLBACK_POSTS,
  getLiveInstagramPosts,
  getAllInstagramPosts,
} from "./instagram";
import { createAdminClient } from "@/lib/eval/admin-client";

vi.mock("@/lib/eval/admin-client", () => ({ createAdminClient: vi.fn() }));

/**
 * A minimal stand-in for the PostgREST query builder: every chained method
 * returns the same thenable, which resolves to the `{ data, error }` the real
 * client would hand back. The assertions below are on what the real exported
 * functions do with that payload — never on the mock itself.
 */
function mockDb(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {
    then: (onOk: (v: unknown) => unknown, onErr?: (e: unknown) => unknown) =>
      Promise.resolve(result).then(onOk, onErr),
  };
  for (const method of ["select", "eq", "order"]) chain[method] = () => chain;
  return { from: () => chain };
}

function useDb(result: { data: unknown; error: unknown }) {
  vi.mocked(createAdminClient).mockReturnValue(mockDb(result) as never);
}

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

  it("parses an IGTV /tv/ URL", () => {
    expect(parseInstagramShortcode("https://www.instagram.com/tv/DY7WHrhDdm5/")).toBe("DY7WHrhDdm5");
  });

  it("finds a URL embedded in surrounding words", () => {
    expect(
      parseInstagramShortcode("look at https://www.instagram.com/reel/DZAmA5TDc5e/ it did well")
    ).toBe("DZAmA5TDc5e");
  });

  it("parses a scheme-less instagram.com URL", () => {
    expect(parseInstagramShortcode("instagram.com/reel/DZFuHE0jdPw")).toBe("DZFuHE0jdPw");
  });

  it("rejects another host that merely contains instagram.com in its path", () => {
    expect(parseInstagramShortcode("https://evil.example.com/instagram.com/p/HACKEDCODE1/")).toBeNull();
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
  });

  it("caps at nine because the grid is a 3x3", () => {
    expect(MAX_LIVE_POSTS).toBe(9);
  });

  it("does not mutate the caller's array", () => {
    const rows = [row("c", 2), row("a", 0), row("b", 1)];
    const before = rows.map((r) => r.shortcode);
    selectGridPosts(rows);
    expect(rows.map((r) => r.shortcode)).toEqual(before);
  });

  it("breaks a position tie deterministically by shortcode", () => {
    const out = selectGridPosts([row("zzz", 0), row("aaa", 0)]);
    expect(out.map((p) => p.shortcode)).toEqual(["aaa", "zzz"]);
  });

  it("returns [] for an empty table", () => {
    expect(selectGridPosts([])).toEqual([]);
  });
});

describe("FALLBACK_POSTS", () => {
  it("fills the grid exactly", () => {
    expect(FALLBACK_POSTS).toHaveLength(MAX_LIVE_POSTS);
  });

  it("is already in the shape selectGridPosts would produce", () => {
    expect(selectGridPosts(FALLBACK_POSTS)).toEqual(FALLBACK_POSTS);
  });

  it("has no duplicate shortcodes", () => {
    expect(new Set(FALLBACK_POSTS.map((p) => p.shortcode)).size).toBe(FALLBACK_POSTS.length);
  });
});

describe("getLiveInstagramPosts", () => {
  beforeEach(() => {
    vi.mocked(createAdminClient).mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("falls back when the client cannot be constructed", async () => {
    vi.mocked(createAdminClient).mockImplementation(() => {
      throw new Error("missing SUPABASE_SERVICE_ROLE_KEY");
    });
    expect(await getLiveInstagramPosts()).toEqual(FALLBACK_POSTS);
  });

  it("falls back when the query returns an error (table not yet migrated)", async () => {
    useDb({ data: null, error: { message: 'relation "media_instagram_posts" does not exist' } });
    expect(await getLiveInstagramPosts()).toEqual(FALLBACK_POSTS);
  });

  it("falls back when the table is empty rather than rendering an empty grid", async () => {
    useDb({ data: [], error: null });
    expect(await getLiveInstagramPosts()).toEqual(FALLBACK_POSTS);
  });

  it("returns the live rows as-is and does not pad them to nine", async () => {
    const rows = [
      { shortcode: "b", label: "", position: 1, is_live: true },
      { shortcode: "a", label: "", position: 0, is_live: true },
      { shortcode: "c", label: "", position: 2, is_live: true },
    ];
    useDb({ data: rows, error: null });
    const out = await getLiveInstagramPosts();
    expect(out.map((p) => p.shortcode)).toEqual(["a", "b", "c"]);
  });
});

describe("getAllInstagramPosts", () => {
  beforeEach(() => {
    vi.mocked(createAdminClient).mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("reports the failure instead of an empty table", async () => {
    useDb({ data: null, error: { message: 'relation "media_instagram_posts" does not exist' } });
    const result = await getAllInstagramPosts();
    expect(result.ok).toBe(false);
    expect(result).toMatchObject({
      ok: false,
      error: 'relation "media_instagram_posts" does not exist',
    });
  });

  it("returns retired rows alongside live ones on success", async () => {
    const rows = [
      { shortcode: "live", label: "", position: 0, is_live: true },
      { shortcode: "retired", label: "", position: 1, is_live: false },
    ];
    useDb({ data: rows, error: null });
    const result = await getAllInstagramPosts();
    expect(result).toEqual({ ok: true, posts: rows });
  });

  it("distinguishes a genuinely empty table from a failure", async () => {
    useDb({ data: [], error: null });
    expect(await getAllInstagramPosts()).toEqual({ ok: true, posts: [] });
  });
});
