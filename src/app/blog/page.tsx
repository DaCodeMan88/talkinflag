import { getAllPosts, sanityConfigured } from "@/lib/sanity";
import { PostCard } from "@/components/blog/PostCard";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "Blog | Talkin Flag — Flag Football News",
  description: "Insights, analysis, and stories from the world of flag football.",
  path: "/blog",
});

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-14">
          <h1 className="font-display text-5xl md:text-7xl uppercase text-brand-white">Blog</h1>
          <p className="mt-3 text-brand-white/60">
            Flag football news, stories, and analysis from the Talkin Flag team.
          </p>
        </div>

        {!sanityConfigured ? (
          <div className="text-center py-20 border border-brand-yellow/20 bg-[#111111]">
            <p className="font-display text-2xl uppercase text-brand-yellow mb-3">Coming Soon</p>
            <p className="text-brand-white/60 text-sm max-w-md mx-auto">
              The Talkin Flag blog is being set up. Check back soon for flag football news,
              player stories, and analysis.
            </p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 border border-brand-yellow/20 bg-[#111111]">
            <p className="font-display text-2xl uppercase text-brand-yellow mb-3">No Posts Yet</p>
            <p className="text-brand-white/60 text-sm">
              Posts will appear here once published in the Sanity Studio.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
