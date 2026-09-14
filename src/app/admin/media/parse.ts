/**
 * Pure helpers for the /admin/media actions.
 *
 * Kept OUT of `actions.ts` for the same reason `blog/constants.ts` exists: a
 * module carrying the use-server directive may only export async server
 * actions, so shared values and types have to live in a sibling module.
 */

/** Result shape every media action returns instead of throwing. */
export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Read a hand-typed performance number.
 *
 * Every non-digit is stripped, so "1,234" and "1.234" both read as 1234 —
 * separators vary by locale and Ambra copies these off Instagram Insights.
 *
 * The cost of that bluntness: the abbreviations Insights actually shows read as
 * their digits only ("20.4K" → 204) and a leading minus is dropped ("-5" → 5).
 * The admin form must therefore ask for the full number. Returns null for
 * blank, missing, or digit-free input so the column stays NULL rather than 0 —
 * "not captured" and "zero plays" are different facts.
 */
export function toInt(v?: string): number | null {
  const digits = (v ?? "").replace(/[^0-9]/g, "");
  const n = Number.parseInt(digits, 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * The host must be instagram.com itself, anchored the same way
 * `parseInstagramShortcode` anchors it: at the start, after a scheme's `//`, or
 * after a subdomain dot. Otherwise `https://evil.example.com/instagram.com/...`
 * would be treated as Instagram.
 */
const IG_HOST = String.raw`(?:^|\/\/|\.)instagram\.com\/`;

/** `instagram.com/share/...` — what the mobile app's Share button produces. */
const SHARE_RE = new RegExp(IG_HOST + String.raw`share(?:\/|\?|$)`, "i");

/** `instagram.com/<username>/reel/<code>/` — the in-app profile browse URL. */
const PROFILE_PREFIXED_RE = new RegExp(
  IG_HOST + String.raw`[A-Za-z0-9_.]+\/(?:reels?|p|tv)\/`,
  "i"
);

/**
 * A specific, actionable message for the two Instagram URL shapes that
 * `parseInstagramShortcode` returns null for but that an owner will genuinely
 * paste. Returns null when there is nothing more useful to say than the
 * generic "that doesn't look like an Instagram link".
 *
 * Only call this after the parser has already failed.
 */
export function describeUnparsableInstagramUrl(input: string): string | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;

  if (SHARE_RE.test(raw)) {
    // The token in a /share/ URL is not the shortcode, and resolving it needs a
    // network fetch that follows Instagram's redirect. Refusing is correct.
    return "Instagram share links can't be read directly. Open the reel in a browser and copy the address from the URL bar instead.";
  }

  if (PROFILE_PREFIXED_RE.test(raw)) {
    return "That link has the profile name in it. Open the reel on its own and copy the address that starts with instagram.com/reel/.";
  }

  return null;
}
