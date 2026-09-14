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
/** A decimal figure, as written in front of a K/M suffix. */
const DECIMAL_RE = /^\d{1,3}(?:,\d{3})*(?:\.\d+)?$|^\d+(?:\.\d+)?$/;
const MULTIPLIER = { k: 1_000, m: 1_000_000 } as const;

/**
 * Read a performance count as a person writes it.
 *
 * Instagram Insights renders "20.4K", so that is the form Ambra is most likely
 * to type or paste — it means 20,400, and storing 204 would quietly corrupt the
 * only number the monthly keep-or-retire decision rests on. Handles:
 *
 *   "20400" · "1,234" · "1.234" · "8 500"  → grouped thousands
 *   "20.4K" · "2k" · "1.2M"                → shorthand, expanded and rounded
 *   "20.4K likes"                          → a whole label pasted in
 *
 * Anything it cannot read confidently returns null rather than a guess: a bare
 * decimal ("20.4"), mixed-up separators ("1,23"), a double decimal ("1.2.3"),
 * a negative, or digits run together with letters. Null is also the answer for
 * blank and missing input, so the column stays NULL — "not captured" and "zero
 * plays" are different facts, and a wrong number is worse than no number.
 */
export function parseCount(v?: string): number | null {
  const raw = (v ?? "").trim().toLowerCase();
  // Greedy run of digits/separators/spaces ending in a digit, an optional K/M,
  // then whatever else was pasted along with it.
  const m = raw.match(/^([\d.,\s]*\d)(\s*)([km])?([\s\S]*)$/);
  if (!m) return null;

  const [, token, gap, suffix, rest] = m;
  // Trailing words are fine ("20.4K likes", "20400 plays"); letters or digits
  // glued straight onto the number are not ("20.4KM", "20400plays") — those
  // mean we misread where the number ended.
  const separated = !!gap || /^[^a-z0-9]/.test(rest);
  if (rest && !separated) return null;

  const figure = token.replace(/\s/g, "");

  if (suffix) {
    if (!DECIMAL_RE.test(figure)) return null;
    return Math.round(
      Number.parseFloat(figure.replace(/,/g, "")) *
        MULTIPLIER[suffix as keyof typeof MULTIPLIER]
    );
  }

  if (/^\d+$/.test(figure)) return Number.parseInt(figure, 10);
  if (!GROUPED_RE.test(figure)) return null;
  return Number.parseInt(figure.replace(/[.,]/g, ""), 10);
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
