import { getAllPosts, getPostBySlug, sanityConfigured } from "@/lib/sanity";
import { getStaticPostBySlug, staticPosts } from "@/lib/static-posts";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { RichText } from "@/components/blog/RichText";
import { ShareButtons } from "@/components/blog/ShareButtons";

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

  // Helper: remove generic OG image so opengraph-image.tsx takes precedence
  function withCustomOg(meta: Awaited<ReturnType<typeof buildMetadata>>) {
    if (meta.openGraph) delete (meta.openGraph as Record<string, unknown>).images;
    if (meta.twitter) delete (meta.twitter as Record<string, unknown>).images;
    return meta;
  }

  // Check static posts first
  const staticPost = getStaticPostBySlug(slug);
  if (staticPost) {
    // Truncate excerpt to ~155 chars for meta description (Google shows ~155-160)
    const metaDescription = staticPost.excerpt.length > 155
      ? staticPost.excerpt.slice(0, 152) + "…"
      : staticPost.excerpt;
    const base = withCustomOg(buildMetadata({
      title: staticPost.title,
      description: metaDescription,
      path: `/blog/${staticPost.slug}`,
      type: "article",
    }));
    // Enrich Open Graph with article-specific metadata
    if (base.openGraph) {
      (base.openGraph as Record<string, unknown>).publishedTime = staticPost.publishedAt;
      (base.openGraph as Record<string, unknown>).modifiedTime = staticPost.publishedAt;
      (base.openGraph as Record<string, unknown>).section = staticPost.category;
      (base.openGraph as Record<string, unknown>).authors = [staticPost.author];
      (base.openGraph as Record<string, unknown>).tags = [staticPost.category, "flag football"];
    }
    return base;
  }

  // Fall through to Sanity
  if (sanityConfigured) {
    const post = await getPostBySlug(slug);
    if (post) {
      return withCustomOg(buildMetadata({
        title: post.title,
        description: post.excerpt || `${post.title} — Talkin Flag Blog`,
        path: `/blog/${post.slug?.current ?? slug}`,
        type: "article",
      }));
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
    // Prefer same-category posts sorted by date desc; fall back to others to fill 3 slots
    const otherPosts = staticPosts
      .filter((p) => p.slug !== slug)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    const sameCategory = otherPosts.filter((p) => p.category === staticPost.category);
    const different = otherPosts.filter((p) => p.category !== staticPost.category);
    const morePosts = [...sameCategory, ...different].slice(0, 3);

    // Estimated reading time (~200 wpm average)
    const wordCount = staticPost.body.trim().split(/\s+/).length;
    const readingMinutes = Math.max(1, Math.round(wordCount / 200));

    // Extract section headings for Table of Contents (posts with 4+ headings get a TOC)
    function slugifyHeading(text: string): string {
      return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
    }
    const headings = staticPost.body
      .split("\n\n")
      .map((b) => b.trim())
      .filter(Boolean)
      .flatMap((block) => {
        const m = block.match(/^\*\*(.+?)\*\*$/);
        return m ? [{ text: m[1], id: slugifyHeading(m[1]) }] : [];
      });

    const faqJsonLd = staticPost.faqItems?.length
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": staticPost.faqItems.map((item) => ({
            "@type": "Question",
            "name": item.q,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": item.a,
            },
          })),
        }
      : null;

    const breadcrumbJsonLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://talkinflag.com" },
        { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://talkinflag.com/blog" },
        { "@type": "ListItem", "position": 3, "name": staticPost.title, "item": `https://talkinflag.com/blog/${staticPost.slug}` },
      ],
    };

    const articleJsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": staticPost.title,
      "description": staticPost.excerpt,
      "datePublished": staticPost.publishedAt,
      "dateModified": staticPost.publishedAt,
      "author": {
        "@type": "Person",
        "name": staticPost.author,
        "url": "https://talkinflag.com/about",
      },
      "publisher": {
        "@type": "Organization",
        "name": "Talkin Flag",
        "url": "https://talkinflag.com",
        "logo": {
          "@type": "ImageObject",
          "url": "https://talkinflag.com/og-image.png",
        },
      },
      "url": `https://talkinflag.com/blog/${staticPost.slug}`,
      "mainEntityOfPage": `https://talkinflag.com/blog/${staticPost.slug}`,
      "articleSection": staticPost.category,
      "wordCount": wordCount,
      // Custom edge-rendered OG image (opengraph-image.tsx)
      "image": {
        "@type": "ImageObject",
        "url": `https://talkinflag.com/blog/${staticPost.slug}/opengraph-image`,
        "width": 1200,
        "height": 630,
      },
    };

    return (
      <div className="min-h-screen bg-brand-black pt-24 pb-20">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
        {faqJsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
          />
        )}
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
              <span aria-hidden="true">·</span>
              <span>{readingMinutes} min read</span>
            </div>
            <div className="flex items-center gap-2">
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
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                  `https://talkinflag.com/blog/${staticPost.slug}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-brand-white/20 text-brand-white/60 font-display text-xs uppercase tracking-widest px-3 py-1.5 hover:border-brand-white/40 hover:text-brand-white transition-colors"
                aria-label="Share on LinkedIn"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
            </div>
          </div>

          {/* Excerpt / pull quote */}
          <p className="text-brand-white/80 text-lg leading-relaxed mb-10 border-l-2 border-brand-yellow pl-5">
            {staticPost.excerpt}
          </p>

          {/* Table of Contents — shown for posts with 4+ sections */}
          {headings.length >= 4 && (
            <nav
              aria-label="Table of contents"
              className="mb-10 bg-[#111111] border border-brand-white/10 p-5"
            >
              <p className="font-display text-[10px] uppercase tracking-[0.3em] text-brand-yellow mb-3">
                In This Article
              </p>
              <ol className="space-y-2">
                {headings.map((h) => (
                  <li key={h.id}>
                    <a
                      href={`#${h.id}`}
                      className="text-brand-white/60 text-sm hover:text-brand-yellow transition-colors leading-snug"
                    >
                      {h.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {/* Body */}
          <RichText body={staticPost.body} />

          {/* FAQ section (if present) */}
          {staticPost.faqItems && staticPost.faqItems.length > 0 && (
            <div className="mt-14 pt-10 border-t border-brand-white/10">
              <h2 className="font-display text-2xl uppercase text-brand-white mb-8">
                Frequently Asked Questions
              </h2>
              <div className="space-y-6">
                {staticPost.faqItems.map((item, i) => (
                  <div key={i} className="border-l-2 border-brand-yellow/30 pl-5">
                    <h3 className="font-display text-base uppercase text-brand-yellow mb-2">
                      {item.q}
                    </h3>
                    <p className="text-brand-white/70 text-sm leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {/* Back to top */}
          <div className="mt-14 text-center">
            <a
              href="#"
              className="inline-flex items-center gap-2 text-brand-white/30 hover:text-brand-yellow text-xs font-display uppercase tracking-widest transition-colors"
              aria-label="Back to top"
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 12V4M4 8l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back to top
            </a>
          </div>

          {/* Share buttons */}
          <div className="mt-14 pt-10 border-t border-brand-white/10">
            <ShareButtons
              title={staticPost.title}
              url={`https://talkinflag.com/blog/${staticPost.slug}`}
            />
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
