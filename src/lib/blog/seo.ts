/**
 * Auto-SEO / GEO helper — a PURE, deterministic, side-effect-free module.
 *
 * Consumed by the admin blog editor (Task 6) and the SEO panel (Task 8) to
 * pre-fill fields and drive a content checklist. Nothing here touches the DB,
 * React, the network, or any global state.
 *
 * "GEO" = Generative Engine Optimization — being cited by AI answer engines.
 * It's served by clean structure: a cover image, internal links, an FAQ/Q&A
 * block, and quotable key-takeaways. The checklist nudges authors toward those.
 *
 * Markdown-lite grammar (what RichText renders): `**bold**`, `[text](url)`,
 * standalone `**Heading**` paragraphs, `- ` bullets, plain paragraphs.
 */

const MAX_META = 160;
const MAX_TITLE = 60;

/**
 * Strip markdown-lite markers down to plain text.
 * `**bold**` → bold, `[text](url)` → text, `- ` bullets removed,
 * heading markers (`#`, `##`, …) removed.
 */
function stripMarkdownLite(input: string): string {
  return input
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // [text](url) -> text
    .replace(/\*\*/g, "") // bold markers
    .replace(/^#{1,6}\s*/gm, "") // ATX headings
    .replace(/^\s*[-*]\s+/gm, "") // bullets
    .replace(/[#*_>`]/g, "") // stray inline markers
    .replace(/\s+/g, " ") // collapse whitespace
    .trim();
}

/**
 * Trim `text` to at most `max` chars on a word boundary. Never cuts mid-word
 * and never leaves a trailing space. Returns text unchanged if already within
 * the limit.
 */
function trimToWordBoundary(text: string, max: number): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > 0 ? slice.slice(0, lastSpace) : slice;
  return cut.replace(/\s+$/, "");
}

/**
 * Turn a title into a clean URL slug.
 * Lowercase, strip punctuation/apostrophes, collapse whitespace to `-`,
 * trim leading/trailing dashes.
 * "Katherine Sowers: What's Next?!" -> "katherine-sowers-whats-next"
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .replace(/['’]/g, "") // apostrophes -> nothing (whats, not what-s)
    .replace(/[^a-z0-9]+/g, "-") // any run of non-alphanumerics -> dash
    .replace(/^-+|-+$/g, ""); // trim edge dashes
}

/**
 * Derive a meta description from a post body or excerpt.
 * Strips markdown-lite markers, collapses whitespace, and trims to
 * <= 160 chars on a word boundary (no trailing space, no mid-word cut).
 */
export function autoMetaDescription(bodyOrExcerpt: string): string {
  const plain = stripMarkdownLite(bodyOrExcerpt);
  if (plain.length <= MAX_META) return plain;
  return trimToWordBoundary(plain, MAX_META);
}

/**
 * Pre-fill helper for the SEO title field. Returns the title as-is when it's
 * within the ~60-char sweet spot (or shorter); when longer, trims to a word
 * boundary <= 60. Kept intentionally simple — the admin can edit it.
 */
export function autoSeoTitle(title: string): string {
  const clean = title.replace(/\s+/g, " ").trim();
  if (clean.length <= MAX_TITLE) return clean;
  return trimToWordBoundary(clean, MAX_TITLE);
}

/**
 * Suggest GEO-quotable key-takeaways: the first sentence of each of the first
 * few non-heading paragraphs, as a starting point the admin edits. Returns []
 * for empty body.
 */
export function keyTakeawaysSuggestion(body: string, n = 3): string[] {
  const trimmed = body.trim();
  if (!trimmed) return [];

  const paragraphs = trimmed
    .split(/\n\s*\n/)
    .map((p) => stripMarkdownLite(p))
    .filter((p) => p.length > 0)
    // Drop standalone heading-ish lines (short, no sentence punctuation).
    .filter((p) => !(p.length < 60 && !/[.!?]/.test(p)));

  const takeaways: string[] = [];
  for (const p of paragraphs.slice(0, n)) {
    const match = p.match(/^.*?[.!?](?=\s|$)/);
    takeaways.push(match ? match[0].trim() : p.trim());
  }
  return takeaways;
}

/** A FAQ / Q&A pair. Structurally compatible with `FaqItem` from static-posts. */
export interface SeoFaqItem {
  q: string;
  a: string;
}

/** Input shape for {@link seoChecklist}. Permissive with optional/null fields. */
export interface SeoChecklistInput {
  title: string;
  seoDescription: string;
  body: string;
  coverImageUrl: string | null | undefined;
  coverImageAlt?: string | null;
  faqItems: SeoFaqItem[] | null | undefined;
  keyTakeaways: string[] | null | undefined;
}

/** A single checklist row. */
export interface SeoChecklistItem {
  id: string;
  label: string;
  pass: boolean;
  hint: string;
}

/**
 * Evaluate a post against the SEO/GEO content checklist. PURE and deterministic.
 * Emits exactly these six checks, each of which passes for a well-formed post:
 *   - title-length   — title present and <= 60 chars
 *   - meta-description — description length in the 50–160 range
 *   - cover-image    — a cover image URL is set
 *   - internal-links — body contains at least one internal `](/…` link
 *   - faq            — at least one FAQ item (GEO Q&A block)
 *   - key-takeaways  — at least three quotable takeaways
 */
export function seoChecklist(post: SeoChecklistInput): SeoChecklistItem[] {
  const title = post.title ?? "";
  const description = post.seoDescription ?? "";
  const body = post.body ?? "";
  const faqItems = post.faqItems ?? [];
  const keyTakeaways = post.keyTakeaways ?? [];

  const hasInternalLink = /\]\(\//.test(body);

  return [
    {
      id: "title-length",
      label: "Title length",
      pass: title.length > 0 && title.length <= MAX_TITLE,
      hint: "Keep the title under 60 characters so it doesn't get truncated in search results.",
    },
    {
      id: "meta-description",
      label: "Meta description",
      pass: description.length >= 50 && description.length <= MAX_META,
      hint: "Write a 50–160 character meta description that summarizes the post and invites the click.",
    },
    {
      id: "cover-image",
      label: "Cover image",
      pass: Boolean(post.coverImageUrl),
      hint: "Add a cover image — it powers the social/OG card and the article preview.",
    },
    {
      id: "internal-links",
      label: "Internal links",
      pass: hasInternalLink,
      hint: "Add at least one internal link to another post or a player/rankings page.",
    },
    {
      id: "faq",
      label: "FAQ / Q&A block",
      pass: faqItems.length >= 1,
      hint: "Add an FAQ item — Q&A blocks are what AI answer engines quote (GEO).",
    },
    {
      id: "key-takeaways",
      label: "Key takeaways",
      pass: keyTakeaways.length >= 3,
      hint: "Add at least three quotable key takeaways to summarize the post for readers and AI engines.",
    },
  ];
}
