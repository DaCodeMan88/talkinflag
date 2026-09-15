import { createAdminClient } from "@/lib/eval/admin-client";

// Re-exported so existing importers (and the tests) keep a single entry
// point, while the parsing itself stays in a module the browser can import.
export {
  INSTAGRAM_HOST_PREFIX,
  parseInstagramShortcode,
  reelUrl,
} from "./parse-shortcode";

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

/**
 * The public grid: live rows only, in position order, capped at nine.
 * Ties break on shortcode so the order never flickers between renders.
 */
export function selectGridPosts<T extends Pick<InstagramPost, "shortcode" | "position" | "is_live">>(
  rows: T[]
): T[] {
  return rows
    .filter((r) => r.is_live)
    // Plain ASCII comparison, not localeCompare: shortcodes are case-sensitive
    // and localeCompare's collation varies with the Node build's ICU data.
    .sort(
      (a, b) =>
        a.position - b.position ||
        (a.shortcode < b.shortcode ? -1 : a.shortcode > b.shortcode ? 1 : 0)
    )
    .slice(0, MAX_LIVE_POSTS);
}

/**
 * Hardcoded copy of the seed, used only when the table read fails or returns
 * nothing. The /media grid must never render empty.
 *
 * This is a snapshot of the seed as of launch (September 2026). It does NOT
 * track Ambra's monthly swaps: once she starts curating, the DB and this array
 * drift apart, and a Supabase outage a year from now would render a year-old
 * grid with stale engagement labels. Refreshing it is a manual job — copy the
 * live rows back in when the grid has meaningfully changed.
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
      .select("id, shortcode, label, position, is_live, plays, likes, metrics_captured_on, updated_at")
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

/**
 * Every row, live and retired, for the admin page.
 *
 * Returns a result rather than a bare array: an empty table and a failed read
 * are different truths, and the admin page must not render "no reels yet" when
 * the real answer is "the table does not exist" (migration 027 is deliberately
 * unapplied in production).
 */
export async function getAllInstagramPosts(): Promise<
  { ok: true; posts: InstagramPost[] } | { ok: false; error: string }
> {
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from("media_instagram_posts")
      .select("id, shortcode, label, position, is_live, plays, likes, metrics_captured_on, updated_at")
      .order("is_live", { ascending: false })
      .order("position", { ascending: true });
    if (error) throw new Error(error.message);
    return { ok: true, posts: (data ?? []) as InstagramPost[] };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("getAllInstagramPosts:", message);
    return { ok: false, error: message };
  }
}
