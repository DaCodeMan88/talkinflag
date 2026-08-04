/**
 * One-shot import: code-authored `staticPosts` → the `blog_posts` table.
 *
 * Why: the blog admin (/admin/blog) can only edit DB rows. Until the launch
 * posts live in the DB, Ambra & Tika see them as read-only "Code posts" and
 * cannot fix a typo without a deploy.
 *
 * Safe to re-run: a slug already present in `blog_posts` is skipped, never
 * overwritten (so a post edited in the admin is never clobbered by a re-run).
 * Every field maps 1:1, and `mergePostsBySlug` already lets DB win over static,
 * so the public /blog output is byte-identical before and after.
 *
 *   npx tsx scripts/import-static-posts.ts --dry-run
 *   npx tsx scripts/import-static-posts.ts
 */

import { createClient } from "@supabase/supabase-js";
import { staticPosts } from "../src/lib/static-posts";
import { autoSeoTitle, autoMetaDescription } from "../src/lib/blog/seo";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (load .env.local)."
  );
  process.exit(1);
}

const dryRun = process.argv.includes("--dry-run");
const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data: existingRows, error: readErr } = await db
    .from("blog_posts")
    .select("slug");
  if (readErr) {
    console.error("Could not read blog_posts:", readErr.message);
    process.exit(1);
  }
  const existing = new Set((existingRows ?? []).map((r) => r.slug as string));

  const toInsert = staticPosts
    .filter((p) => !existing.has(p.slug))
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      author: p.author || "Talkin Flag",
      category: p.category,
      excerpt: p.excerpt,
      body: p.body,
      // Blank SEO fields get the same auto-fill the editor applies on save, so
      // the admin SEO checklist scores these the way a hand-written post scores.
      seo_title: autoSeoTitle(p.title),
      seo_description: autoMetaDescription(p.excerpt || p.body),
      key_takeaways: [],
      faq_items: p.faqItems ?? [],
      // "TODO_OWNER" is a deliberate placeholder — the render path skips it, and
      // keeping it preserves the open owner action to supply the real video id.
      youtube_video_id: p.youtubeVideoId ?? null,
      guest_name: p.guestName ?? null,
      guest_role: p.guestRole ?? null,
      status: "published",
      published_at: p.publishedAt,
      created_at: p.publishedAt,
      updated_at: p.publishedAt,
    }));

  console.log(
    `${staticPosts.length} static posts · ${existing.size} rows already in blog_posts · ${toInsert.length} to insert`
  );
  for (const row of toInsert) console.log(`  + ${row.slug}`);

  if (dryRun) {
    console.log("\n--dry-run: nothing written.");
    return;
  }
  if (toInsert.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  const { data, error } = await db
    .from("blog_posts")
    .insert(toInsert)
    .select("slug");
  if (error) {
    console.error("Insert failed:", error.message);
    process.exit(1);
  }
  console.log(`\nInserted ${data?.length ?? 0} posts.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
