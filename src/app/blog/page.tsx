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

  // Derive unique categories from static posts
  const categories = Array.from(
    new Set(staticPosts.map((p) => p.category))
  ).sort();

  // Filter static posts by category if one is selected
  const filteredPosts = activeCategory
    ? staticPosts.filter((p) => p.category === activeCategory)
    : staticPosts;

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20">
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
              <BlogCategoryFilter categories={categories} current={activeCategory} />
            </Suspense>

            {/* Post count */}
            {activeCategory && (
              <p className="text-brand-white/40 text-xs uppercase tracking-widest mb-6">
                {filteredPosts.length} post{filteredPosts.length !== 1 ? "s" : ""} in {activeCategory}
              </p>
            )}

            {/* Static editorial posts */}
            {filteredPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {filteredPosts.map((post) => {
                  const mins = readingTime(post.body);
                  return (
                    <Link
                      key={post.slug}
                      href={`/blog/${post.slug}`}
                      aria-label={`Read: ${post.title}`}
                      className="group"
                    >
                      <article className="h-full bg-[#111111] border border-brand-white/10 hover:border-brand-yellow/40 transition-all duration-300 p-6 flex flex-col">
                        <span className="text-brand-yellow font-display text-xs uppercase tracking-widest mb-3">
                          {post.category}
                        </span>
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
            ) : (
              <div className="py-20 text-center border border-brand-white/5 bg-[#0a0a0a]">
                <p className="text-brand-white/40 text-sm">No posts in this category yet.</p>
                <button
                  onClick={undefined}
                  className="mt-4 text-brand-yellow font-display text-xs uppercase tracking-widest hover:underline"
                  aria-label="View all posts"
                >
                  {/* Cleared by client filter */}
                </button>
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
