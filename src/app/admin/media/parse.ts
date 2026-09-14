import { INSTAGRAM_HOST_PREFIX } from "@/lib/media/instagram";

/**
 * Pure helpers for the /admin/media actions.
 *
 * Kept OUT of `actions.ts` for the same reason `blog/constants.ts` exists: a
 * module carrying the use-server directive may only export async server
 * actions, so shared values and types have to live in a sibling module.
 */

/** Result shape every media action returns instead of throwing. */
export type ActionResult = { ok: true } | { ok: false; error: string };

/** Thousands grouped in threes: 1,234,567 / 1.234 / 8 500 (spaces stripped first). */
const GROUPED_RE = /^\d{1,3}(?:[.,]\d{3})*$/;
/** A figure written in front of a K/M suffix: 20.4 / 2 / 1,234 (grouped). */
const DECIMAL_RE = /^\d{1,3}(?:,\d{3})*(?:\.\d+)?$|^\d+(?:\.\d+)?$/;
/**
 * The same figure with an Italian-locale decimal comma: 20,4 — a comma before
 * one or two digits. Before exactly three digits it is a thousands separator
 * and DECIMAL_RE's reading wins, so "1,234K" is 1,234,000 and not 1234.
 */
const COMMA_DECIMAL_RE = /^\d+,\d{1,2}$/;
const MULTIPLIER = { k: 1_000, m: 1_000_000 } as const;

/**
 * Read a performance count as a person writes it.
 *
 * Instagram Insights renders "20.4K" — or "20,4K" on Ambra's Italian-locale
 * phone — so that is the form she is most likely to type or paste. It means
 * 20,400, and storing 204 would quietly corrupt the only number the monthly
 * keep-or-retire decision rests on. Handles:
 *
 *   "20400" · "1,234" · "1.234" · "8 500"  → grouped thousands
 *   "20.4K" · "20,4K" · "2k" · "1.2M"      → shorthand, expanded and rounded
 *   "20.4K likes" · "20400 plays"          → a whole label pasted in
 *
 * Anything it cannot read confidently returns null rather than a guess: a bare
 * decimal ("20.4"), mixed-up separators ("1,23"), a double decimal ("1.2.3"),
 * a negative, digits run together with letters, or a detached k/m that might be
 * a multiplier or might be the first letter of a word ("8500 k", "12 min").
 * Null is also the answer for blank and missing input, so the column stays
 * NULL — "not captured" and "zero plays" are different facts, and a wrong
 * number is worse than no number.
 */
export function parseCount(v?: string): number | null {
  const raw = (v ?? "").trim().toLowerCase();
  // Greedy run of digits/separators/spaces ending in a digit, then a K/M that
  // is attached to it and is not the first letter of a longer word, then
  // whatever else was pasted along with it.
  const m = raw.match(/^([\d.,\s]*\d)([km](?![a-z]))?([\s\S]*)$/);
  if (!m) return null;

  const [, token, suffix, rest] = m;

  // Trailing words are fine ("20.4K likes"); letters or digits glued straight
  // onto the number are not ("20.4KM", "20400plays") — those mean we misread
  // where the number ended.
  if (rest && /^[a-z0-9]/.test(rest)) return null;

  // A detached k/m is unreadable: "8500 k" may be 8,500,000 and "12 min" is
  // twelve. Guessing either way is a 1000x error, so refuse.
  if (!suffix && /^[km]/.test(rest.trim())) return null;

  const figure = token.replace(/\s/g, "");

  if (suffix) {
    const mult = MULTIPLIER[suffix as keyof typeof MULTIPLIER];
    if (DECIMAL_RE.test(figure)) {
      return Math.round(Number.parseFloat(figure.replace(/,/g, "")) * mult);
    }
    if (COMMA_DECIMAL_RE.test(figure)) {
      return Math.round(Number.parseFloat(figure.replace(",", ".")) * mult);
    }
    return null;
  }

  if (/^\d+$/.test(figure)) return Number.parseInt(figure, 10);
  if (!GROUPED_RE.test(figure)) return null;
  return Number.parseInt(figure.replace(/[.,]/g, ""), 10);
}

/**
 * The capture date for a pair of hand-read metrics: today when at least one
 * number was actually entered, null when neither was. Stamping a date over two
 * blanks would claim a reading that never happened, and the admin page's
 * staleness indicator reads this column.
 */
export function capturedOn(
  plays: number | null,
  likes: number | null
): string | null {
  if (plays === null && likes === null) return null;
  return new Date().toISOString().slice(0, 10);
}

// Both matchers below are anchored to the host by the same fragment
// `parseInstagramShortcode` uses, so a lookalike host
// (`https://evil.example.com/instagram.com/...`) is never treated as Instagram.

/** `instagram.com/share/...` — what the mobile app's Share button produces. */
const SHARE_RE = new RegExp(
  INSTAGRAM_HOST_PREFIX + String.raw`share(?:\/|\?|$)`,
  "i"
);

/** `instagram.com/<username>/reel/<code>/` — the in-app profile browse URL. */
const PROFILE_PREFIXED_RE = new RegExp(
  INSTAGRAM_HOST_PREFIX + String.raw`[A-Za-z0-9_.]+\/(?:reels?|p|tv)\/`,
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
