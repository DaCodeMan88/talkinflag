import { getAllPosts, getPostBySlug, sanityConfigured } from "@/lib/sanity";
import { getStaticPostBySlug, staticPosts } from "@/lib/static-posts";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;

export async function generateStaticParams() {
  const params: { slug: string }[] = [];

  // Always include static posts
  staticPosts.forEach((p) => params.push({ slug: p.slug }));

  // Add Sanity posts if configured
  if (sanityConfigured) {
    const posts = await getAllPosts();
    posts.forEach((p) => {
      if (!params.find((x) => x.slug === p.slug.current)) {
        params.push({ slug: p.slug.current });
      }
    });
  }

  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  // Check static posts first
  const staticPost = getStaticPostBySlug(slug);
  if (staticPost) {
    return buildMetadata({
      title: staticPost.title,
      description: staticPost.excerpt,
      path: `/blog/${staticPost.slug}`,
    });
  }

  // Fall through to Sanity
  if (sanityConfigured) {
    const post = await getPostBySlug(slug);
    if (post) {
      return buildMetadata({
        title: post.title,
        description: post.excerpt || `${post.title} — Talkin Flag Blog`,
        path: `/blog/${post.slug?.current ?? slug}`,
      });
    }
  }

  return { title: "Post Not Found | Talkin Flag" };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // ── Static post ──────────────────────────────────────────────────────────
  const staticPost = getStaticPostBySlug(slug);
  if (staticPost) {
    // Other posts to surface at the bottom (exclude current)
    const morePosts = staticPosts.filter((p) => p.slug !== slug).slice(0, 3);

    const paragraphs = staticPost.body
      .split("\n\n")
      .map((p) => p.trim())
      .filter(Boolean);

    const articleJsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": staticPost.title,
      "description": staticPost.excerpt,
      "datePublished": staticPost.publishedAt,
      "author": { "@type": "Person", "name": staticPost.author },
      "publisher": {
        "@type": "Organization",
        "name": "Talkin Flag",
        "url": "https://talkinflag.com",
      },
      "url": `https://talkinflag.com/blog/${staticPost.slug}`,
      "articleSection": staticPost.category,
    };

    return (
      <div className="min-h-screen bg-brand-black pt-24 pb-20">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-brand-white/50 hover:text-brand-yellow text-sm mb-10 transition-colors group"
          >
            <span className="transition-transform group-hover:-translate-x-1" aria-hidden="true">←</span>
            All Posts
          </Link>

          {/* Category */}
          <span className="text-brand-yellow font-display text-xs uppercase tracking-widest">
            {staticPost.category}
          </span>

          {/* Title */}
          <h1 className="font-display text-3xl md:text-5xl uppercase text-brand-white mt-2 leading-tight">
            {staticPost.title}
          </h1>

          {/* Meta + share */}
          <div className="flex flex-wrap items-center justify-between gap-4 mt-4 mb-10">
            <div className="flex items-center gap-4 text-brand-white/40 text-xs">
              <span>{staticPost.author}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={staticPost.publishedAt}>
                {new Date(staticPost.publishedAt).toLocaleDateString("en-US", {
                  month: "long", day: "numeric", year: "numeric",
                })}
              </time>
            </div>
            <a
              href={`https://x.com/intent/tweet?text=${encodeURIComponent(
                `"${staticPost.title}" via @TalkinFlagShow`
              )}&url=${encodeURIComponent(`https://talkinflag.com/blog/${staticPost.slug}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-brand-white/20 text-brand-white/60 font-display text-xs uppercase tracking-widest px-3 py-1.5 hover:border-brand-white/40 hover:text-brand-white transition-colors"
              aria-label="Share on X"
            >
              <svg width="10" height="10" viewBox="0 0 1200 1227" fill="currentColor" aria-hidden="true">
                <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.163 519.284ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z"/>
              </svg>
              Share on X
            </a>
          </div>

          {/* Excerpt / pull quote */}
          <p className="text-brand-white/80 text-lg leading-relaxed mb-10 border-l-2 border-brand-yellow pl-5">
            {staticPost.excerpt}
          </p>

          {/* Body */}
          <div className="space-y-5">
            {paragraphs.map((para, i) => (
              <p key={i} className="text-brand-white/70 leading-relaxed">
                {para}
              </p>
            ))}
          </div>

          {/* Footer CTA */}
          <div className="mt-16 pt-10 border-t border-brand-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="font-display text-xs uppercase tracking-widest text-brand-yellow mb-1">Listen Now</p>
              <p className="text-brand-white/60 text-sm">Explore the episodes that inspired this story.</p>
            </div>
            <Link
              href="/episodes"
              className="shrink-0 inline-flex items-center gap-2 bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm px-6 py-3 hover:bg-yellow-400 transition-colors"
            >
              All Episodes →
            </Link>
          </div>

          {/* Newsletter inline CTA */}
          <div className="mt-10 bg-[#111111] border border-brand-yellow/15 p-8 text-center">
            <p className="font-display text-xs uppercase tracking-[0.3em] text-brand-yellow mb-2">Stay in the Game</p>
            <p className="font-display text-2xl uppercase text-brand-white mb-2">
              Weekly Flag Football News
            </p>
            <p className="text-brand-white/50 text-sm mb-6">
              Episodes, player rankings, events, and stories from around the world.
            </p>
            <Link
              href="/#newsletter"
              className="inline-flex items-center gap-2 border border-brand-yellow/40 text-brand-yellow font-display uppercase tracking-widest text-sm px-6 py-3 hover:bg-brand-yellow hover:text-brand-black transition-colors"
            >
              Subscribe Free →
            </Link>
          </div>

          {/* More from the blog */}
          {morePosts.length > 0 && (
            <div className="mt-14 pt-10 border-t border-brand-white/10">
              <h2 className="font-display text-xs uppercase tracking-widest text-brand-yellow mb-6">
                More from the Blog
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {morePosts.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/blog/${p.slug}`}
                    className="group block bg-[#111111] border border-brand-white/10 hover:border-brand-yellow/40 transition-colors p-5"
                  >
                    <span className="text-brand-yellow font-display text-[10px] uppercase tracking-widest">
                      {p.category}
                    </span>
                    <h3 className="font-display text-sm uppercase text-brand-white leading-snug mt-1 group-hover:text-brand-yellow transition-colors line-clamp-3">
                      {p.title}
                    </h3>
                  </Link>
                ))}
              </div>
              <div className="mt-6 text-center">
                <Link
                  href="/blog"
                  className="text-brand-white/40 font-display text-xs uppercase tracking-widest hover:text-brand-yellow transition-colors"
                >
                  ← All Posts
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Sanity post ──────────────────────────────────────────────────────────
  if (!sanityConfigured) notFound();

  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-brand-white/50 hover:text-brand-yellow text-sm mb-10 transition-colors group"
        >
          <span className="transition-transform group-hover:-translate-x-1" aria-hidden="true">←</span>
          All Posts
        </Link>

        {post.category && (
          <span className="text-brand-yellow font-display text-xs uppercase tracking-widest">
            {post.category}
          </span>
        )}
        <h1 className="font-display text-3xl md:text-5xl uppercase text-brand-white mt-2 leading-tight">
          {post.title}
        </h1>
        <div className="flex items-center gap-4 mt-4 mb-10 text-brand-white/40 text-xs">
          <span>{post.author || "Talkin Flag"}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString("en-US", {
              month: "long", day: "numeric", year: "numeric",
            })}
          </time>
        </div>

        {post.excerpt && (
          <p className="text-brand-white/80 text-lg leading-relaxed mb-10 border-l-2 border-brand-yellow pl-5">
            {post.excerpt}
          </p>
        )}

        {/* Portable text body — install @portabletext/react when needed */}
        <p className="text-brand-white/60 text-sm italic">
          Rich content rendering coming soon.
        </p>
      </div>
    </div>
  );
}
