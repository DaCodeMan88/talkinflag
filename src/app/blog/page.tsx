import { getAllPosts, sanityConfigured } from "@/lib/sanity";
import { staticPosts } from "@/lib/static-posts";
import { PostCard } from "@/components/blog/PostCard";
import { BlogCategoryFilter } from "@/components/blog/BlogCategoryFilter";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { Suspense } from "react";

export const revalidate = 300;

export const metadata = {
  ...buildMetadata({
    title: "Blog | Talkin Flag — Flag Football News",
    description: "Insights, analysis, and stories from the world of flag football.",
    path: "/blog",
  }),
  alternates: {
    canonical: "https://talkinflag.com/blog",
    types: {
      "application/rss+xml": "https://talkinflag.com/blog/feed.xml",
    },
  },
};

function readingTime(body: string): number {
  return Math.max(1, Math.round(body.trim().split(/\s+/).length / 200));
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { category: rawCategory } = await searchParams;
  const activeCategory = typeof rawCategory === "string" ? rawCategory : null;

  const posts = await getAllPosts();
  const hasSanityPosts = posts.length > 0;

  // Derive unique categories with counts, sorted by count descending (most popular first)
  const categoryCounts = staticPosts.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});
  const categories = Array.from(new Set(staticPosts.map((p) => p.category)))
    .sort((a, b) => (categoryCounts[b] ?? 0) - (categoryCounts[a] ?? 0));

  // Sort all posts by date descending (newest first)
  const sortedPosts = [...staticPosts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  // Posts published within the last 30 days get a "New" badge
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const isNew = (publishedAt: string) => new Date(publishedAt) >= thirtyDaysAgo;

  // Filter by category if one is selected (preserving date order)
  const filteredPosts = activeCategory
    ? sortedPosts.filter((p) => p.category === activeCategory)
    : sortedPosts;

  // Alias for ItemList JSON-LD
  const sortedForSchema = sortedPosts;

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Talkin Flag Blog — Flag Football News & Analysis",
    "url": "https://talkinflag.com/blog",
    "itemListElement": sortedForSchema.map((p, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": p.title,
      "url": `https://talkinflag.com/blog/${p.slug}`,
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://talkinflag.com" },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://talkinflag.com/blog" },
    ],
  };

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="font-display text-5xl md:text-7xl uppercase text-brand-white">Blog</h1>
          <p className="mt-3 text-brand-white/60">
            Flag football news, stories, and analysis from the Talkin Flag team.
          </p>
        </div>

        {hasSanityPosts ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        ) : (
          <>
            {/* Category filter pills */}
            <Suspense
              fallback={
                <div className="flex flex-wrap gap-2 mb-10">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-8 w-24 bg-brand-white/5 animate-pulse" />
                  ))}
                </div>
              }
            >
              <BlogCategoryFilter
                categories={categories}
                current={activeCategory}
                counts={categoryCounts}
                total={staticPosts.length}
              />
            </Suspense>

            {/* Post count */}
            {activeCategory && (
              <p className="text-brand-white/40 text-xs uppercase tracking-widest mb-6">
                {filteredPosts.length} post{filteredPosts.length !== 1 ? "s" : ""} in {activeCategory}
              </p>
            )}

            {/* Static editorial posts */}
            {filteredPosts.length > 0 ? (
              <>
                {/* Featured post — newest, shown full-width hero when no category filter */}
                {!activeCategory && (() => {
                  const featured = filteredPosts[0];
                  const mins = readingTime(featured.body);
                  return (
                    <Link
                      href={`/blog/${featured.slug}`}
                      aria-label={`Read: ${featured.title}`}
                      className="group block mb-6"
                    >
                      <article className="bg-[#111111] border border-brand-yellow/20 hover:border-brand-yellow/50 transition-all duration-300 p-8 md:p-10 md:flex md:gap-10 md:items-start">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="bg-brand-yellow text-brand-black font-display text-[10px] uppercase tracking-widest px-2.5 py-1">
                              Latest
                            </span>
                            <span className="text-brand-yellow font-display text-xs uppercase tracking-widest">
                              {featured.category}
                            </span>
                          </div>
                          <h2 className="font-display text-3xl md:text-4xl uppercase text-brand-white leading-tight group-hover:text-brand-yellow transition-colors mb-4">
                            {featured.title}
                          </h2>
                          <p className="text-brand-white/60 text-sm leading-relaxed line-clamp-3 mb-6">
                            {featured.excerpt}
                          </p>
                          <div className="flex items-center gap-4 text-brand-white/40 text-xs">
                            <span>{featured.author}</span>
                            <span aria-hidden="true">·</span>
                            <time dateTime={featured.publishedAt}>
                              {new Date(featured.publishedAt).toLocaleDateString("en-US", {
                                month: "long", day: "numeric", year: "numeric",
                              })}
                            </time>
                            <span aria-hidden="true">·</span>
                            <span>{mins} min read</span>
                          </div>
                        </div>
                        <div className="shrink-0 mt-6 md:mt-0">
                          <span className="inline-flex items-center gap-2 border border-brand-yellow/30 text-brand-yellow font-display text-xs uppercase tracking-widest px-5 py-3 group-hover:bg-brand-yellow group-hover:text-brand-black transition-colors">
                            Read Article
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </span>
                        </div>
                      </article>
                    </Link>
                  );
                })()}

                {/* Remaining posts grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {(activeCategory ? filteredPosts : filteredPosts.slice(1)).map((post) => {
                    const mins = readingTime(post.body);
                    return (
                      <Link
                        key={post.slug}
                        href={`/blog/${post.slug}`}
                        aria-label={`Read: ${post.title}`}
                        className="group"
                      >
                        <article className="h-full bg-[#111111] border border-brand-white/10 hover:border-brand-yellow/40 transition-all duration-300 p-6 flex flex-col">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-brand-yellow font-display text-xs uppercase tracking-widest">
                              {post.category}
                            </span>
                            {isNew(post.publishedAt) && (
                              <span className="bg-brand-yellow text-brand-black font-display text-[9px] uppercase tracking-widest px-1.5 py-0.5 leading-none">
                                New
                              </span>
                            )}
                          </div>
                          <h2 className="font-display text-xl md:text-2xl uppercase text-brand-white leading-snug group-hover:text-brand-yellow transition-colors line-clamp-3 flex-1">
                            {post.title}
                          </h2>
                          <p className="text-brand-white/60 text-sm mt-3 line-clamp-3 leading-relaxed">
                            {post.excerpt}
                          </p>
                          <div className="flex items-center justify-between mt-5 pt-4 border-t border-brand-white/10">
                            <div className="flex items-center gap-3 text-brand-white/40 text-xs">
                              <span>{post.author}</span>
                              <span aria-hidden="true">·</span>
                              <span>{mins} min read</span>
                            </div>
                            <span className="text-brand-white/40 text-xs">
                              {new Date(post.publishedAt).toLocaleDateString("en-US", {
                                month: "short", day: "numeric", year: "numeric",
                              })}
                            </span>
                          </div>
                        </article>
                      </Link>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="py-20 text-center border border-brand-white/5 bg-[#0a0a0a]">
                <p className="text-brand-white/40 text-sm">No posts in this category yet.</p>
                <Link
                  href="/blog"
                  className="block mt-4 text-brand-yellow font-display text-xs uppercase tracking-widest hover:underline"
                >
                  ← All Posts
                </Link>
              </div>
            )}

            {/* RSS discovery */}
            <div className="flex items-center gap-3 text-brand-white/30 text-xs mt-4">
              <a
                href="/blog/feed.xml"
                className="flex items-center gap-1.5 hover:text-brand-yellow transition-colors"
                aria-label="RSS Feed"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <circle cx="6.18" cy="17.82" r="2.18"/>
                  <path d="M4 4.44v2.83c7.03 0 12.73 5.7 12.73 12.73h2.83c0-8.59-6.97-15.56-15.56-15.56zm0 5.66v2.83c3.9 0 7.07 3.17 7.07 7.07h2.83c0-5.47-4.43-9.9-9.9-9.9z"/>
                </svg>
                RSS Feed
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
