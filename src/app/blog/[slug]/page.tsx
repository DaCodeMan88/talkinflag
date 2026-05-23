import { getAllPosts, getPostBySlug, sanityConfigured } from "@/lib/sanity";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const revalidate = 300;

export async function generateStaticParams() {
  if (!sanityConfigured) return [];
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug.current }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.title} | Talkin Flag`,
    description: post.excerpt || undefined,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!sanityConfigured) notFound();

  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <span>·</span>
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString("en-US", {
              month: "long", day: "numeric", year: "numeric",
            })}
          </time>
        </div>

        {post.excerpt && (
          <p className="text-brand-white/70 text-lg leading-relaxed mb-8 border-l-2 border-brand-yellow pl-4">
            {post.excerpt}
          </p>
        )}

        <div className="prose prose-invert prose-yellow max-w-none text-brand-white/80">
          <p className="text-brand-white/60 text-sm italic">
            Full article rendering requires Sanity portable text renderer.
            Install @portabletext/react to render rich content.
          </p>
        </div>
      </div>
    </div>
  );
}
