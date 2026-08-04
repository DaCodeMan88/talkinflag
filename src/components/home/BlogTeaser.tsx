import Link from "next/link";
import { getAllPostRecords } from "@/lib/blog/posts";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

// Shows the 3 most recent blog posts on the homepage, from the same unified
// loader /blog uses — so a post published in /admin/blog appears here too.
export async function BlogTeaser() {
  // getAllPostRecords is already sorted newest-first.
  const recent = (await getAllPostRecords()).slice(0, 3);

  if (recent.length === 0) return null;

  return (
    <section className="bg-brand-black py-20 px-6 border-t border-brand-white/5" aria-label="Latest blog posts">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal direction="up">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="font-display text-brand-yellow text-[10px] uppercase tracking-[0.4em] mb-2">
                From the Blog
              </p>
              <h2 className="font-display text-4xl md:text-5xl uppercase text-brand-white leading-none">
                Stories &amp; Insights
              </h2>
            </div>
            <Link
              href="/blog"
              className="text-brand-yellow font-display uppercase tracking-widest text-sm hover:underline hidden md:block shrink-0"
            >
              All Posts →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recent.map((post, i) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                aria-label={`Read: ${post.title}`}
                className="group"
              >
                <article
                  className={`h-full p-6 flex flex-col border transition-colors duration-300 ${
                    i === 0
                      ? "bg-[#111111] border-brand-yellow/30 hover:border-brand-yellow/60"
                      : "bg-[#0d0d0d] border-brand-white/8 hover:border-brand-yellow/30"
                  }`}
                >
                  <span className="font-display text-brand-yellow text-[10px] uppercase tracking-widest mb-3">
                    {post.category}
                  </span>
                  <h3 className="font-display text-lg uppercase text-brand-white leading-snug group-hover:text-brand-yellow transition-colors line-clamp-3 flex-1">
                    {post.title}
                  </h3>
                  <p className="text-brand-white/50 text-sm mt-3 line-clamp-2 leading-relaxed">
                    {post.excerpt}
                  </p>
                  <div className="mt-5 pt-4 border-t border-brand-white/8">
                    <span className="text-brand-yellow font-display text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      Read More →
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          <div className="mt-6 text-center md:hidden">
            <Link
              href="/blog"
              className="text-brand-yellow font-display uppercase tracking-widest text-sm hover:underline"
            >
              All Posts →
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
