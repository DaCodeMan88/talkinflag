import { createAdminClient } from "@/lib/eval/admin-client";

/** The grid is a 3x3. Nine is the product decision, not an incidental limit. */
export const MAX_LIVE_POSTS = 9;

export interface InstagramPost {
  shortcode: string;
  label: string;
  position: number;
  is_live: boolean;
  plays?: number | null;
  likes?: number | null;
  metrics_captured_on?: string | null;
  id?: string;
  updated_at?: string | null;
}

/** Instagram shortcodes are URL-safe base64-ish, typically 11 chars. */
const SHORTCODE_RE = /^[A-Za-z0-9_-]{5,24}$/;
const URL_RE = /instagram\.com\/(?:reels?|p|tv)\/([A-Za-z0-9_-]{5,24})/i;

/**
 * Pull the shortcode out of anything Ambra is likely to paste: a reel URL, a
 * post URL, a URL with an `?igsh=` share param, or the bare code itself.
 * Returns null when there's no post in the input (e.g. a profile URL).
 */
export function parseInstagramShortcode(input: string): string | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;

  const m = raw.match(URL_RE);
  if (m) return m[1];

  // A bare shortcode — but never mistake a URL we failed to match for one.
  if (!raw.includes("/") && !raw.includes(".") && SHORTCODE_RE.test(raw)) return raw;

  return null;
}

/**
 * The public grid: live rows only, in position order, capped at nine.
 * Ties break on shortcode so the order never flickers between renders.
 */
export function selectGridPosts<T extends Pick<InstagramPost, "shortcode" | "position" | "is_live">>(
  rows: T[]
): T[] {
  return rows
    .filter((r) => r.is_live)
    .sort((a, b) => a.position - b.position || a.shortcode.localeCompare(b.shortcode))
    .slice(0, MAX_LIVE_POSTS);
}

/**
 * Hardcoded copy of the seed, used only when the table read fails or returns
 * nothing. The /media grid must never render empty.
 */
export const FALLBACK_POSTS: InstagramPost[] = [
  { shortcode: "DKULB7cNxpR", label: "Most popular · 20.4K likes", position: 0, is_live: true },
  { shortcode: "DHHVMyKN9Qw", label: "Popular · 8.5K likes", position: 1, is_live: true },
  { shortcode: "DZIWIHgt8bq", label: "Fiesta Bowl Flag Football Classic", position: 2, is_live: true },
  { shortcode: "DY2T9iytnox", label: "Flag football is already here", position: 3, is_live: true },
  { shortcode: "DZNRMgSDZOs", label: "S3 Episode 20 · EFAF", position: 4, is_live: true },
  { shortcode: "DZFuHE0jdPw", label: "Brazil Nation Spotlight", position: 5, is_live: true },
  { shortcode: "DZAmA5TDc5e", label: "Athletes & coaches", position: 6, is_live: true },
  { shortcode: "DY7WHrhDdm5", label: "S3 Episode 19 · Fiesta Bowl", position: 7, is_live: true },
  { shortcode: "DYztBlcDcBL", label: "Jamaica Nation Spotlight", position: 8, is_live: true },
];

/** Live grid for the public /media page. Falls back rather than rendering empty. */
export async function getLiveInstagramPosts(): Promise<InstagramPost[]> {
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from("media_instagram_posts")
      .select("*")
      .eq("is_live", true)
      .order("position", { ascending: true });
    if (error) throw new Error(error.message);
    const picked = selectGridPosts((data ?? []) as InstagramPost[]);
    return picked.length > 0 ? picked : FALLBACK_POSTS;
  } catch (e) {
    console.error("getLiveInstagramPosts:", e instanceof Error ? e.message : e);
    return FALLBACK_POSTS;
  }
}

/** Every row, live and retired, for the admin page. */
export async function getAllInstagramPosts(): Promise<InstagramPost[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("media_instagram_posts")
    .select("*")
    .order("is_live", { ascending: false })
    .order("position", { ascending: true });
  if (error) {
    console.error("getAllInstagramPosts:", error.message);
    return [];
  }
  return (data ?? []) as InstagramPost[];
}
