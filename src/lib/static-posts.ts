/**
 * Code-authored blog posts — RETIRED 2026-08-03.
 *
 * All 29 launch posts were migrated into the `blog_posts` table
 * (`scripts/import-static-posts.ts`) so admins can edit and delete them from
 * /admin/blog without a deploy. The DB is now the single source of truth: a
 * code copy would shadow-resurrect any post an admin deletes, since
 * `mergePostsBySlug` only lets the DB win, never disappear.
 *
 * The types stay because `PostRecord` and the editor's FAQ shape build on them.
 * The array stays (empty) as the seam for re-adding a hard-coded post — but
 * prefer the admin. Original content: `git show 7a5b5c8:src/lib/static-posts.ts`.
 */

export interface FaqItem {
  q: string;
  a: string;
}

export interface StaticPost {
  slug: string;
  title: string;
  author: string;
  publishedAt: string; // ISO date string
  category: string;
  excerpt: string;
  body: string; // Plain text / simple markdown-like paragraphs
  faqItems?: FaqItem[]; // Optional FAQ for FAQPage JSON-LD structured data
  isStatic: true;
  // Interview fields
  youtubeVideoId?: string; // YouTube video ID (not full URL) — enables embedded player on blog page
  guestName?: string; // e.g. "Katherine Sowers"
  guestRole?: string; // e.g. "Head Coach, Italy Women's National Team"
}

export const staticPosts: StaticPost[] = [];

export function getStaticPostBySlug(slug: string): StaticPost | undefined {
  return staticPosts.find((p) => p.slug === slug);
}
