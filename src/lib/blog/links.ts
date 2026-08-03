/**
 * Internal-link suggester.
 *
 * Scans a post body for plain-text mentions of other posts' titles and player
 * names that are NOT already wrapped in a markdown link, and proposes wrapping
 * them in `[text](href)`. Pure + deterministic so it can run live in the editor
 * and be unit-tested without a DB.
 */

/** A post or player that a mention could link to. */
export interface LinkTarget {
  title: string;
  href: string;
}

/** A single suggested internal link. */
export interface LinkSuggestion {
  /** The matched phrase, preserving the body's original casing. */
  text: string;
  /** The post/player href to link to. */
  href: string;
  /** Human-readable reason shown in the editor. */
  reason: string;
}

/** Escape a string for safe use inside a RegExp. */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Compute the character ranges in `body` that fall inside an existing markdown
 * link `[text](href)`. A mention overlapping any of these ranges is considered
 * "already linked" and is skipped.
 */
function linkedRanges(body: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  const re = /\[[^\]]*\]\([^)]*\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    ranges.push([m.index, m.index + m[0].length]);
  }
  return ranges;
}

function overlapsLinked(
  start: number,
  end: number,
  ranges: Array<[number, number]>
): boolean {
  return ranges.some(([s, e]) => start < e && end > s);
}

/**
 * Suggest internal links for a body given candidate posts + players.
 *
 * - Matching is case-insensitive; the returned `text` preserves the body casing.
 * - Mentions already inside a `[...]( ... )` markdown link are ignored.
 * - Longer titles rank first (so "History of Flag Football" beats "Flag Football").
 * - De-duped so the same text -> href pair is only suggested once.
 */
export function suggestInternalLinks(
  body: string,
  opts: { posts: LinkTarget[]; players: LinkTarget[] }
): LinkSuggestion[] {
  if (!body) return [];

  const candidates: Array<LinkTarget & { reason: string }> = [
    ...opts.posts.map((p) => ({ ...p, reason: "Links to related post" })),
    ...opts.players.map((p) => ({ ...p, reason: "Links to player profile" })),
  ].filter((c) => c.title.trim() && c.href.trim());

  // Longer titles first so the most specific match wins the ranking.
  candidates.sort((a, b) => b.title.length - a.title.length);

  const ranges = linkedRanges(body);
  const suggestions: LinkSuggestion[] = [];
  const seen = new Set<string>();

  for (const c of candidates) {
    const re = new RegExp(escapeRegExp(c.title), "gi");
    let m: RegExpExecArray | null;
    while ((m = re.exec(body)) !== null) {
      const start = m.index;
      const end = start + m[0].length;
      if (overlapsLinked(start, end, ranges)) continue;

      const text = m[0]; // original body casing
      const key = `${text.toLowerCase()}|${c.href}`;
      if (seen.has(key)) continue;
      seen.add(key);

      suggestions.push({ text, href: c.href, reason: c.reason });
      break; // one suggestion per target is enough
    }
  }

  return suggestions;
}
