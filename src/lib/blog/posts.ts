/**
 * Unified blog post loader.
 *
 * Merges posts from three sources into a single `PostRecord` shape:
 *  - DB (`blog_posts` table, service-role reads) — the authoring source going forward
 *  - Static (`src/lib/static-posts.ts`) — hand-written launch content
 *  - Sanity (legacy CMS) — only when configured (currently unconfigured)
 *
 * On slug collisions: DB wins over static wins over Sanity.
 */

import type { FaqItem, StaticPost } from "@/lib/static-posts";
import { staticPosts, getStaticPostBySlug } from "@/lib/static-posts";
import { createAdminClient } from "@/lib/eval/admin-client";
import { getAllPosts, sanityConfigured } from "@/lib/sanity";

/**
 * Superset of the fields a blog post can carry across all sources.
 * Unlike `StaticPost`, `isStatic` is not required — source is tracked via `source`.
 */
export interface PostRecord {
  slug: string;
  title: string;
  author: string;
  publishedAt: string; // ISO date string
  category: string;
  excerpt: string;
  body: string;
  faqItems?: FaqItem[];
  // Interview fields (carried from StaticPost)
  youtubeVideoId?: string;
  guestName?: string;
  guestRole?: string;
  // DB-authored extras
  coverImageUrl?: string;
  coverImageAlt?: string;
  seoTitle?: string;
  seoDescription?: string;
  ogImageUrl?: string;
  keyTakeaways?: string[];
  source: "db" | "static" | "sanity";
}

/** A raw row from the `blog_posts` table (snake_case columns). */
interface BlogPostRow {
  slug: string;
  title: string;
  author: string | null;
  category: string | null;
  excerpt: string | null;
  body: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  key_takeaways: unknown;
  faq_items: unknown;
  published_at: string | null;
  [key: string]: unknown;
}

/**
 * Parse a JSONB column that may arrive as a real array (supabase-js) or as a
 * JSON string. Returns [] for null/undefined, unparseable strings, or any
 * non-array value — so DB-sourced posts always carry arrays, never undefined.
 */
export function parseJsonArray<T>(value: unknown): T[] {
  if (value == null) return [];
  let parsed: unknown = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return [];
    }
  }
  return Array.isArray(parsed) ? (parsed as T[]) : [];
}

export function toPostRecordFromStatic(p: StaticPost): PostRecord {
  return {
    slug: p.slug,
    title: p.title,
    author: p.author,
    publishedAt: p.publishedAt,
    category: p.category,
    excerpt: p.excerpt,
    body: p.body,
    faqItems: p.faqItems,
    youtubeVideoId: p.youtubeVideoId,
    guestName: p.guestName,
    guestRole: p.guestRole,
    source: "static",
  };
}

export function toPostRecordFromDb(row: BlogPostRow): PostRecord {
  return {
    slug: row.slug,
    title: row.title,
    author: row.author ?? "Talkin Flag",
    publishedAt: row.published_at ?? "",
    category: row.category ?? "",
    excerpt: row.excerpt ?? "",
    body: row.body ?? "",
    coverImageUrl: row.cover_image_url ?? undefined,
    coverImageAlt: row.cover_image_alt ?? undefined,
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
    ogImageUrl: row.og_image_url ?? undefined,
    keyTakeaways: parseJsonArray<string>(row.key_takeaways),
    faqItems: parseJsonArray<FaqItem>(row.faq_items),
    source: "db",
  };
}

/**
 * Map a Sanity post (see `SanityPost` in `@/lib/sanity`) to a PostRecord.
 *
 * KNOWN LIMITATION: Sanity `body` is Portable Text (structured blocks), not a
 * string, and both `getAllPostRecords` and `getPostRecordBySlug` resolve Sanity
 * via `getAllPosts()` — the list shape, which does not include `body` at all.
 * So Sanity-sourced posts contribute list metadata only, with an empty `body`.
 * Sanity is currently unconfigured, so this is latent. If it is ever re-enabled,
 * the single-slug path should instead call `getPostBySlug(slug)` (returns
 * `SanityPostFull`) and map its Portable Text `body` to renderable content.
 */
function toPostRecordFromSanity(p: {
  title?: string;
  slug?: { current?: string } | string;
  publishedAt?: string;
  author?: string;
  category?: string;
  excerpt?: string;
  body?: unknown;
}): PostRecord {
  const slug =
    typeof p.slug === "string" ? p.slug : p.slug?.current ?? "";
  return {
    slug,
    title: p.title ?? "",
    author: p.author ?? "Talkin Flag",
    publishedAt: p.publishedAt ?? "",
    category: p.category ?? "",
    excerpt: p.excerpt ?? "",
    body: typeof p.body === "string" ? p.body : "",
    source: "sanity",
  };
}

/**
 * Merge two ordered lists of PostRecords, deduping by slug (`db` wins on
 * collision), then sort newest-first by `publishedAt`. Pure.
 */
export function mergePostsBySlug(
  db: PostRecord[],
  rest: PostRecord[]
): PostRecord[] {
  const bySlug = new Map<string, PostRecord>();
  // Add `rest` first, then let `db` overwrite on slug collision.
  for (const p of rest) bySlug.set(p.slug, p);
  for (const p of db) bySlug.set(p.slug, p);
  return Array.from(bySlug.values()).sort((a, b) =>
    (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "")
  );
}

/** Read all published posts from the DB. Never throws — returns [] on error. */
export async function getPublishedDbPosts(): Promise<PostRecord[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (error) {
      console.error("getPublishedDbPosts:", error.message);
      return [];
    }
    return (data ?? []).map((row) => toPostRecordFromDb(row as BlogPostRow));
  } catch (err) {
    console.error("getPublishedDbPosts:", err);
    return [];
  }
}

/** All post records across DB + static (+ Sanity if configured), DB winning. */
export async function getAllPostRecords(): Promise<PostRecord[]> {
  const db = await getPublishedDbPosts();
  const stat = staticPosts.map(toPostRecordFromStatic);

  let sanity: PostRecord[] = [];
  if (sanityConfigured) {
    try {
      const posts = await getAllPosts();
      sanity = posts.map(toPostRecordFromSanity);
    } catch (err) {
      console.error("getAllPostRecords (sanity):", err);
    }
  }

  // DB wins over static wins over Sanity.
  return mergePostsBySlug(db, mergePostsBySlug(stat, sanity));
}

/** Resolve a single post by slug: DB published → static → Sanity, else null. */
export async function getPostRecordBySlug(
  slug: string
): Promise<PostRecord | null> {
  // 1. DB (published only)
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .limit(1);
    if (error) {
      console.error("getPostRecordBySlug (db):", error.message);
    } else if (data && data.length > 0) {
      return toPostRecordFromDb(data[0] as BlogPostRow);
    }
  } catch (err) {
    console.error("getPostRecordBySlug (db):", err);
  }

  // 2. Static
  const staticPost = getStaticPostBySlug(slug);
  if (staticPost) return toPostRecordFromStatic(staticPost);

  // 3. Sanity
  if (sanityConfigured) {
    try {
      const posts = await getAllPosts();
      const match = posts.find(
        (p) =>
          (typeof p.slug === "string" ? p.slug : p.slug?.current) === slug
      );
      if (match) return toPostRecordFromSanity(match);
    } catch (err) {
      console.error("getPostRecordBySlug (sanity):", err);
    }
  }

  return null;
}
