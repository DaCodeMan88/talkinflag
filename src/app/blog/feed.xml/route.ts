import { NextResponse } from "next/server";
import { staticPosts } from "@/lib/static-posts";
import { getAllPosts, sanityConfigured } from "@/lib/sanity";

export const revalidate = 3600;

const SITE_URL = "https://talkinflag.com";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  // Combine static + Sanity posts, sorted newest first
  interface FeedPost {
    title: string;
    slug: string;
    excerpt: string;
    author: string;
    publishedAt: string;
    category: string;
  }

  const posts: FeedPost[] = [...staticPosts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  if (sanityConfigured) {
    try {
      const sanityPosts = await getAllPosts();
      for (const p of sanityPosts) {
        posts.push({
          title: p.title,
          slug: p.slug?.current ?? "",
          excerpt: p.excerpt || "",
          author: p.author || "Talkin Flag",
          publishedAt: p.publishedAt,
          category: p.category || "Blog",
        });
      }
      posts.sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
    } catch {
      // Sanity unavailable — use static posts only
    }
  }

  const items = posts
    .map((post) => {
      const url = `${SITE_URL}/blog/${post.slug}`;
      const pubDate = new Date(post.publishedAt).toUTCString();
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(post.excerpt)}</description>
      <pubDate>${pubDate}</pubDate>
      <author>noreply@talkinflag.com (${escapeXml(post.author)})</author>
      <category>${escapeXml(post.category)}</category>
    </item>`;
    })
    .join("\n");

  const lastBuildDate = posts[0]
    ? new Date(posts[0].publishedAt).toUTCString()
    : new Date().toUTCString();

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Talkin Flag Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>Flag football insights, analysis, and stories from the Talkin Flag team.</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <image>
      <url>${SITE_URL}/og?title=Talkin+Flag+Blog</url>
      <title>Talkin Flag Blog</title>
      <link>${SITE_URL}/blog</link>
    </image>
    <atom:link href="${SITE_URL}/blog/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
