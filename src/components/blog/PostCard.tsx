import Link from "next/link";
import Image from "next/image";
import { SanityPost } from "@/lib/sanity";

export function PostCard({ post }: { post: SanityPost }) {
  return (
    <Link href={`/blog/${post.slug.current}`} aria-label={`Read: ${post.title}`}>
      <article className="group bg-[#222222] border border-brand-white/10 hover:border-brand-yellow/40 transition-all duration-300 overflow-hidden">
        {post.mainImage && (
          <div className="relative aspect-video overflow-hidden">
            <Image
              src={post.mainImage}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        <div className="p-5">
          {post.category && (
            <span className="text-brand-yellow font-display text-xs uppercase tracking-widest">
              {post.category}
            </span>
          )}
          <h2 className="font-display text-lg uppercase text-brand-white mt-2 leading-snug line-clamp-2">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="text-brand-white/60 text-sm mt-2 line-clamp-2 leading-relaxed">
              {post.excerpt}
            </p>
          )}
          <div className="flex items-center justify-between mt-4">
            <span className="text-brand-white/40 text-xs">
              {post.author || "Talkin Flag"}
            </span>
            <span className="text-brand-white/40 text-xs">
              {new Date(post.publishedAt).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric",
              })}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
