/**
 * Shared blog-editor constants + input types.
 *
 * Kept OUT of `actions.ts` because a server-action module (one with the
 * use-server directive) may only export async functions — value exports like
 * `BLOG_CATEGORIES` must live here so both
 * the server actions and the client editor can import them.
 */

/**
 * Allowed post categories — reuses the set already used across staticPosts.
 * The editor's <select> and server-side validation both read from this list.
 */
export const BLOG_CATEGORIES = [
  "Beginner Guide",
  "Coaching",
  "Community",
  "International",
  "Mental Performance",
  "Profile",
  "Recruiting",
  "Resources",
  "Women's Flag",
  "News",
  "Analysis",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

/** A FAQ / Q&A pair as sent from the editor. */
export interface FaqInput {
  q: string;
  a: string;
}

/** The camelCase shape the editor sends to the server actions. */
export interface BlogEditorInput {
  title: string;
  category: string;
  excerpt: string;
  body: string;
  author?: string;
  coverImageUrl?: string;
  coverImageAlt?: string;
  seoTitle?: string;
  seoDescription?: string;
  ogImageUrl?: string;
  keyTakeaways?: string[];
  faqItems?: FaqInput[];
  youtubeVideoId?: string;
  guestName?: string;
  guestRole?: string;
}

export type ActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };
