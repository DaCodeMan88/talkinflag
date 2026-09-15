/**
 * Pure Instagram URL parsing — no Supabase, no env, no server-only imports.
 *
 * This lives apart from `instagram.ts` on purpose. `instagram.ts` pulls in
 * `createAdminClient`, which reads `SUPABASE_SERVICE_ROLE_KEY`; the admin
 * media editor is a client component and must be able to parse a pasted URL
 * for its preview without dragging the service-role client into the browser
 * bundle. `instagram.ts` re-exports everything here, so every existing import
 * site keeps working unchanged.
 */

/** Instagram shortcodes are URL-safe base64-ish, typically 11 chars. */
const SHORTCODE_RE = /^[A-Za-z0-9_-]{5,24}$/;

/**
 * The host must be instagram.com itself — anchored at the start of the string,
 * after a scheme's `//`, or after a subdomain dot. Without that anchor,
 * `https://evil.example.com/instagram.com/p/X/` would parse as a real post.
 *
 * Exported so every Instagram URL matcher is anchored by this one fragment.
 * A second hand-written copy of a security-relevant anchor is a copy that
 * drifts.
 */
export const INSTAGRAM_HOST_PREFIX = String.raw`(?:^|\/\/|\.)instagram\.com\/`;

const URL_RE = new RegExp(
  INSTAGRAM_HOST_PREFIX + String.raw`(?:reels?|p|tv)\/([A-Za-z0-9_-]{5,24})`,
  "i"
);

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

/** The canonical public URL for a shortcode — the one the grid embeds. */
export function reelUrl(shortcode: string): string {
  return `https://www.instagram.com/reel/${shortcode}/`;
}
