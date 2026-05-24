import { getAllPosts, sanityConfigured } from "@/lib/sanity";
import { staticPosts } from "@/lib/static-posts";
import { PostCard } from "@/components/blog/PostCard";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "Blog | Talkin Flag — Flag Football News",
  description: "Insights, analysis, and stories from the world of flag football.",
  path: "/blog",
});

export default async function BlogPage() {
  const posts = await getAllPosts();
  const hasSanityPosts = posts.length > 0;

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-14">
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
            {/* Static editorial posts — shown until Sanity CMS has content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {staticPosts.map((post) => (
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
                      <span className="text-brand-white/40 text-xs">{post.author}</span>
                      <span className="text-brand-white/40 text-xs">
                        {new Date(post.publishedAt).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            {/* CTA to submit posts */}
            {!sanityConfigured ? null : (
              <div className="text-center py-10 border border-brand-yellow/10 bg-[#0a0a0a]">
                <p className="text-brand-white/40 text-sm">
                  More posts coming soon. Written by Ambra & Tika.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
