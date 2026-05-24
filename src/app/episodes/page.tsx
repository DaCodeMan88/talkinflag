import { getEpisodes } from "@/lib/youtube";
import { EpisodeCard } from "@/components/episodes/EpisodeCard";
import { YouTubeFacade } from "@/components/episodes/YouTubeFacade";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: "Episodes | Talkin Flag — The Flag Football Podcast",
  description: "39+ conversations with elite athletes, coaches, founders, and doctors shaping flag football worldwide.",
  path: "/episodes",
});

export default async function EpisodesPage() {
  const episodes = await getEpisodes(50);

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h1 className="font-display text-5xl md:text-7xl uppercase text-brand-white">
            Episodes
          </h1>
          <p className="mt-4 text-brand-white/60 max-w-xl mx-auto">
            {episodes.length}+ conversations with the biggest names shaping flag football worldwide.
          </p>
        </div>

        {episodes[0] && (
          <div className="mb-12">
            <p className="font-display text-xs text-brand-yellow uppercase tracking-widest mb-4">Latest Episode</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#222222] border border-brand-yellow/30 p-6">
              {/* YouTubeFacade: shows thumbnail until user clicks — avoids youtube.com
                  third-party scripts loading on page init, significantly improves LCP */}
              <div className="relative aspect-video">
                <YouTubeFacade videoId={episodes[0].id} title={episodes[0].title} />
              </div>
              <div className="flex flex-col justify-center">
                {episodes[0].episodeNumber && (
                  <span className="text-brand-yellow font-display text-xs uppercase tracking-widest">Ep {episodes[0].episodeNumber}</span>
                )}
                <h2 className="font-display text-2xl md:text-3xl uppercase text-brand-white mt-2 leading-tight">
                  {episodes[0].guestName || episodes[0].title}
                </h2>
                <p className="text-brand-white/60 text-sm mt-3 line-clamp-3">
                  {episodes[0].description}
                </p>
                <p className="text-brand-white/40 text-xs mt-4">
                  {new Date(episodes[0].publishedAt).toLocaleDateString("en-US", {
                    month: "long", day: "numeric", year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {episodes.slice(1).map((episode) => (
            <EpisodeCard key={episode.id} episode={episode} />
          ))}
        </div>
      </div>
    </div>
  );
}
