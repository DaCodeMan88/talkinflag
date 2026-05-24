import { getEpisodes } from "@/lib/youtube";
import { EpisodeCard } from "@/components/episodes/EpisodeCard";
import { YouTubeFacade } from "@/components/episodes/YouTubeFacade";
import { EpisodeSearch } from "@/components/episodes/EpisodeSearch";
import { buildMetadata } from "@/lib/seo";
import { Suspense } from "react";

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: "Episodes | Talkin Flag — The Flag Football Podcast",
  description: "39+ conversations with elite athletes, coaches, founders, and doctors shaping flag football worldwide.",
  path: "/episodes",
});

export default async function EpisodesPage() {
  const episodes = await getEpisodes(50);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Talkin Flag Episodes",
    "url": "https://talkinflag.com/episodes",
    "itemListElement": episodes.map((ep, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": ep.guestName ? `${ep.guestName} — ${ep.title}` : ep.title,
      "url": `https://talkinflag.com/episodes/${ep.id}`,
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://talkinflag.com" },
      { "@type": "ListItem", "position": 2, "name": "Episodes", "item": "https://talkinflag.com/episodes" },
    ],
  };

  const podcastSeriesJsonLd = {
    "@context": "https://schema.org",
    "@type": "PodcastSeries",
    "name": "Talkin Flag",
    "description": "The global flag football podcast hosted by Ambra & Tika Marcucci of the Italian National Team. Conversations with elite athletes, coaches, founders, and doctors shaping the sport worldwide.",
    "url": "https://talkinflag.com/episodes",
    "image": "https://talkinflag.com/og-image.png",
    "inLanguage": "en",
    "numberOfEpisodes": episodes.length,
    "author": [
      { "@type": "Person", "name": "Ambra Marcucci", "sameAs": "https://instagram.com/ambramarcu" },
      { "@type": "Person", "name": "Tika Marcucci", "sameAs": "https://instagram.com/tikamarcu" },
    ],
    "sameAs": [
      "https://youtube.com/@thetalkinballsnetwork",
      "https://instagram.com/talkinflagshow",
    ],
    "publisher": {
      "@type": "Organization",
      "name": "Talkin Flag",
      "url": "https://talkinflag.com",
    },
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(podcastSeriesJsonLd) }}
      />
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

        {/* Client-side search — filters across all loaded episodes (excluding featured).
            Wrapped in Suspense because EpisodeSearch uses useSearchParams(). */}
        <Suspense fallback={
          <div className="text-brand-white/40 text-sm py-8 text-center font-display uppercase tracking-widest">
            Loading episodes…
          </div>
        }>
          <EpisodeSearch episodes={episodes.slice(1)} />
        </Suspense>
      </div>
    </div>
  );
}
