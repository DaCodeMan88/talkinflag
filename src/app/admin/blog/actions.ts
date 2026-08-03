"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/eval/admin-client";
import { slugify, autoMetaDescription, autoSeoTitle } from "@/lib/blog/seo";
import {
  BLOG_CATEGORIES,
  type BlogEditorInput,
  type ActionResult,
} from "./constants";

const SLUG_RE = /^[a-z0-9-]+$/;

/** Trim + coalesce a possibly-undefined string to "". */
function s(v: string | undefined | null): string {
  return (v ?? "").trim();
}

/**
 * Validate the editor input. Returns an error string, or null when valid.
 * Never throws — callers turn a non-null result into `{ ok:false, error }`.
 */
function validate(input: BlogEditorInput): string | null {
  if (!s(input.title)) return "Title is required.";
  if (!s(input.excerpt)) return "Excerpt is required.";
  if (!s(input.body)) return "Body is required.";
  const category = s(input.category);
  if (!category) return "Category is required.";
  if (!(BLOG_CATEGORIES as readonly string[]).includes(category)) {
    return `Category must be one of: ${BLOG_CATEGORIES.join(", ")}.`;
  }
  return null;
}

/**
 * Find a unique slug for `base`, suffixing -2, -3, … on collision.
 * `ignoreId` lets an update keep its own current slug row from counting as a
 * collision against itself. Queries the base slug and any `slug-N` variants.
 */
async function uniqueSlug(
  db: ReturnType<typeof createAdminClient>,
  base: string,
  ignoreId?: string
): Promise<string> {
  const safeBase = base || "post";
  // Pull the base and any suffixed variants in one query.
  const { data } = await db
    .from("blog_posts")
    .select("id, slug")
    .or(`slug.eq.${safeBase},slug.like.${safeBase}-%`);

  const taken = new Set(
    (data ?? [])
      .filter((r: { id: string; slug: string }) => r.id !== ignoreId)
      .map((r: { slug: string }) => r.slug)
  );

  if (!taken.has(safeBase)) return safeBase;
  for (let n = 2; ; n++) {
    const candidate = `${safeBase}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}

/**
 * Map camelCase editor input → snake_case DB columns, applying the blank-SEO
 * auto-fill rule (only derive seo_title/seo_description when the input is blank).
 */
function toDbFields(input: BlogEditorInput) {
  const excerpt = s(input.excerpt);
  const body = s(input.body);
  const seoTitle = s(input.seoTitle) || autoSeoTitle(s(input.title));
  const seoDescription =
    s(input.seoDescription) || autoMetaDescription(excerpt || body);

  return {
    title: s(input.title),
    category: s(input.category),
    excerpt,
    body,
    author: s(input.author) || "Talkin Flag",
    cover_image_url: s(input.coverImageUrl) || null,
    cover_image_alt: s(input.coverImageAlt) || null,
    seo_title: seoTitle || null,
    seo_description: seoDescription || null,
    og_image_url: s(input.ogImageUrl) || null,
    key_takeaways: (input.keyTakeaways ?? [])
      .map((t) => (t ?? "").trim())
      .filter(Boolean),
    faq_items: (input.faqItems ?? [])
      .map((f) => ({ q: (f.q ?? "").trim(), a: (f.a ?? "").trim() }))
      .filter((f) => f.q || f.a),
    youtube_video_id: s(input.youtubeVideoId) || null,
    guest_name: s(input.guestName) || null,
    guest_role: s(input.guestRole) || null,
  };
}

/** Revalidate every surface that renders a given post/slug. */
function revalidateAll(slug: string) {
  revalidatePath("/blog");
  revalidatePath("/admin/blog");
  revalidatePath(`/blog/${slug}`);
}

/** Insert a new draft post. */
export async function createPost(input: BlogEditorInput): Promise<ActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized." };

  const invalid = validate(input);
  if (invalid) return { ok: false, error: invalid };

  const db = createAdminClient();
  const fields = toDbFields(input);
  const slug = await uniqueSlug(db, slugify(fields.title));

  const { data, error } = await db
    .from("blog_posts")
    .insert({ ...fields, slug, status: "draft", created_by: admin.id })
    .select("id, slug")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidateAll(data.slug);
  return { ok: true, id: data.id as string };
}

/** Validate + update an existing post. Slug stays stable once set. */
export async function updatePost(
  id: string,
  input: BlogEditorInput
): Promise<ActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized." };

  const invalid = validate(input);
  if (invalid) return { ok: false, error: invalid };

  const db = createAdminClient();

  // Fetch the current slug so we keep it stable (only regenerate if empty).
  const { data: existing, error: readErr } = await db
    .from("blog_posts")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  if (readErr) return { ok: false, error: readErr.message };
  if (!existing) return { ok: false, error: "Post not found." };

  const fields = toDbFields(input);
  const currentSlug = (existing.slug as string | null) ?? "";
  const slug =
    currentSlug && SLUG_RE.test(currentSlug)
      ? currentSlug
      : await uniqueSlug(db, slugify(fields.title), id);

  const { error } = await db
    .from("blog_posts")
    .update({ ...fields, slug, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidateAll(slug);
  return { ok: true, id };
}

/** Publish: status → 'published'; set published_at only on first publish. */
export async function publishPost(id: string): Promise<ActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized." };

  const db = createAdminClient();
  const { data: existing, error: readErr } = await db
    .from("blog_posts")
    .select("slug, published_at")
    .eq("id", id)
    .maybeSingle();
  if (readErr) return { ok: false, error: readErr.message };
  if (!existing) return { ok: false, error: "Post not found." };

  const update: { status: string; published_at?: string } = {
    status: "published",
  };
  if (!existing.published_at) update.published_at = new Date().toISOString();

  const { error } = await db.from("blog_posts").update(update).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidateAll((existing.slug as string) ?? "");
  return { ok: true, id };
}

/** Unpublish: status → 'draft' (published_at left as-is). */
export async function unpublishPost(id: string): Promise<ActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized." };

  const db = createAdminClient();
  const { data: existing, error: readErr } = await db
    .from("blog_posts")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  if (readErr) return { ok: false, error: readErr.message };
  if (!existing) return { ok: false, error: "Post not found." };

  const { error } = await db
    .from("blog_posts")
    .update({ status: "draft" })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidateAll((existing.slug as string) ?? "");
  return { ok: true, id };
}

/** Archive: status → 'archived'. */
export async function archivePost(id: string): Promise<ActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized." };

  const db = createAdminClient();
  const { data: existing, error: readErr } = await db
    .from("blog_posts")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  if (readErr) return { ok: false, error: readErr.message };
  if (!existing) return { ok: false, error: "Post not found." };

  const { error } = await db
    .from("blog_posts")
    .update({ status: "archived" })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidateAll((existing.slug as string) ?? "");
  return { ok: true, id };
}
