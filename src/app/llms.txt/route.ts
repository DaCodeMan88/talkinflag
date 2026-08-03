import { staticPosts } from "@/lib/static-posts";
import { getPublishedDbPosts } from "@/lib/blog/posts";

export const revalidate = 300;

/**
 * GEO discoverability: a plain-text list of published blog post URLs for AI
 * answer engines / crawlers (an emerging convention akin to robots.txt/sitemap).
 * DB reads are best-effort — falls back to static posts if the DB is down.
 */
export async function GET() {
  const slugs = new Set<string>();

  try {
    const dbPosts = await getPublishedDbPosts();
    dbPosts.forEach((p) => slugs.add(p.slug));
  } catch {
    // DB unreachable — static slugs still listed below.
  }
  staticPosts.forEach((p) => slugs.add(p.slug));

  const lines = [
    "# Talkin Flag — published blog posts",
    "# Flag football news, player profiles, rankings and coaching.",
    "",
    ...Array.from(slugs).map((slug) => `https://talkinflag.com/blog/${slug}`),
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
