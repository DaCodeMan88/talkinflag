import { getEpisodes } from "@/lib/youtube";
import { notFound } from "next/navigation";
import { EpisodeCard } from "@/components/episodes/EpisodeCard";
import { ShareButton } from "@/components/episodes/ShareButton";
import Link from "next/link";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateStaticParams() {
  const episodes = await getEpisodes(50);
  return episodes.map((ep) => ({ id: ep.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const episodes = await getEpisodes(50);
  const episode = episodes.find((e) => e.id === id);
  if (!episode) return { title: "Episode Not Found | Talkin Flag" };

  return buildMetadata({
    title: episode.guestName || episode.title,
    description: episode.description.slice(0, 160),
    image: episode.thumbnail,
    path: `/episodes/${id}`,
  });
}

export default async function EpisodePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const episodes = await getEpisodes(50);
  const episode = episodes.find((e) => e.id === id);
  if (!episode) notFound();

  const related = episodes.filter((e) => e.id !== episode.id).slice(0, 4);

  const formattedDate = new Date(episode.publishedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // X/Twitter share intent URL (no client JS needed)
  const shareText = encodeURIComponent(
    `Listening to "${episode.guestName || episode.title}" on @TalkinFlagShow 🏈🇮🇹`
  );
  const xShareUrl = `https://x.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(
    `https://talkinflag.com/episodes/${id}`
  )}`;

  // JSON-LD: BreadcrumbList
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://talkinflag.com" },
      { "@type": "ListItem", "position": 2, "name": "Episodes", "item": "https://talkinflag.com/episodes" },
      { "@type": "ListItem", "position": 3, "name": episode.guestName || episode.title, "item": `https://talkinflag.com/episodes/${id}` },
    ],
  };

  // JSON-LD for podcast episode
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    "name": episode.title,
    "description": episode.description.slice(0, 500),
    "url": `https://talkinflag.com/episodes/${id}`,
    "datePublished": episode.publishedAt,
    "associatedMedia": {
      "@type": "MediaObject",
      "contentUrl": episode.youtubeUrl,
      "embedUrl": `https://www.youtube.com/embed/${episode.id}`,
    },
    "thumbnailUrl": episode.thumbnail,
    "partOfSeries": {
      "@type": "PodcastSeries",
      "name": "Talkin Flag",
      "url": "https://talkinflag.com",
    },
    ...(episode.episodeNumber && { "episodeNumber": episode.episodeNumber }),
    ...(episode.guestName && {
      "actor": { "@type": "Person", "name": episode.guestName },
    }),
  };

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Back navigation */}
        <Link
          href="/episodes"
          className="inline-flex items-center gap-2 text-brand-white/50 hover:text-brand-yellow text-sm mb-8 transition-colors group"
        >
          <span className="transition-transform group-hover:-translate-x-1" aria-hidden="true">←</span>
          All Episodes
        </Link>

        {/* Video embed */}
        <div className="aspect-video w-full mb-8 bg-[#111111] overflow-hidden">
          <iframe
            src={`https://www.youtube.com/embed/${episode.id}?rel=0&modestbranding=1&autoplay=1`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={episode.title}
          />
        </div>

        {/* Episode metadata badges */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {episode.episodeNumber && (
            <span className="bg-brand-yellow text-brand-black font-display text-xs uppercase tracking-widest px-3 py-1">
              Ep {episode.episodeNumber}
            </span>
          )}
          <time
            dateTime={episode.publishedAt}
            className="text-brand-white/40 text-sm"
          >
            {formattedDate}
          </time>
        </div>

        {/* Title */}
        <h1 className="font-display text-3xl md:text-5xl uppercase text-brand-white leading-tight">
          {episode.guestName || episode.title}
        </h1>

        {/* If guest name shown as h1, show full title below */}
        {episode.guestName && episode.title !== episode.guestName && (
          <p className="mt-2 text-brand-white/50 text-sm leading-snug">
            {episode.title}
          </p>
        )}

        {/* Action row */}
        <div className="flex flex-wrap gap-3 mt-6 mb-8 pb-8 border-b border-brand-white/10">
          <a
            href={episode.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-brand-yellow text-brand-black font-display text-xs uppercase tracking-widest px-4 py-2 hover:bg-yellow-400 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            Watch on YouTube
          </a>
          <a
            href={xShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-brand-white/20 text-brand-white/60 font-display text-xs uppercase tracking-widest px-4 py-2 hover:border-brand-white/40 hover:text-brand-white transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 1200 1227" fill="currentColor" aria-hidden="true">
              <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.163 519.284ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z"/>
            </svg>
            Share on X
          </a>
          <ShareButton title={episode.guestName || episode.title} />
        </div>

        {/* Description */}
        <div>
          <h2 className="font-display text-xs uppercase tracking-widest text-brand-yellow mb-3">
            About This Episode
          </h2>
          <p className="text-brand-white/70 leading-relaxed whitespace-pre-line">
            {episode.description}
          </p>
        </div>

        {/* Related episodes */}
        {related.length > 0 && (
          <div className="mt-20 pt-10 border-t border-brand-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl uppercase text-brand-white">More Episodes</h2>
              <Link
                href="/episodes"
                className="text-brand-yellow font-display text-xs uppercase tracking-widest hover:underline"
              >
                All Episodes →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map((ep) => (
                <EpisodeCard key={ep.id} episode={ep} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
