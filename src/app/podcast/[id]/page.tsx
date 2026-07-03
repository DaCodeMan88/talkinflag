import { safeJsonLd } from "@/lib/jsonld";
import { getEpisodes, getEpisodeById, deriveTopicTags } from "@/lib/youtube";
import { createServerClient } from "@/lib/supabase";
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

  const base = buildMetadata({
    title: episode.guestName || episode.title,
    description: episode.description.slice(0, 160),
    image: episode.thumbnail,
    path: `/podcast/${id}`,
  });
  // Let opengraph-image.tsx generate the branded OG card instead
  if (base.openGraph) delete (base.openGraph as Record<string, unknown>).images;
  if (base.twitter) delete (base.twitter as Record<string, unknown>).images;
  return base;
}

export default async function EpisodePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const episodes = await getEpisodes(50);
  const baseEpisode = episodes.find((e) => e.id === id);
  if (!baseEpisode) notFound();

  // Try to get full description from videos.list; fall back to search snippet
  const fullEpisode = await getEpisodeById(id);
  const episode = fullEpisode ?? baseEpisode;

  const related = episodes.filter((e) => e.id !== episode.id).slice(0, 4);

  // Topic tags — from full content if available, otherwise derive from title
  const tags = episode.tags?.length
    ? episode.tags
    : deriveTopicTags(episode.title, episode.description);

  // Guest intro: first non-empty paragraph of description (often a bio summary)
  const descParagraphs = episode.description.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const guestIntro = descParagraphs.length > 1 ? descParagraphs[0] : null;
  const showNotes = guestIntro ? descParagraphs.slice(1).join("\n\n") : episode.description;

  // Related player lookup — match guest name against players DB
  let relatedPlayers: { id: string; first_name: string; last_name: string; position: string | null; school_or_team: string | null }[] = [];
  if (episode.guestName) {
    const nameParts = episode.guestName.trim().split(/\s+/);
    const supabase = createServerClient();
    const { data } = await supabase
      .from("players")
      .select("id, first_name, last_name, position, school_or_team")
      .eq("is_approved", true)
      .or(
        nameParts.map((n) => `first_name.ilike.%${n}%,last_name.ilike.%${n}%`).join(",")
      )
      .limit(3);
    relatedPlayers = data ?? [];
  }

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
    `https://talkinflag.com/podcast/${id}`
  )}`;

  // JSON-LD: BreadcrumbList
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://talkinflag.com" },
      { "@type": "ListItem", "position": 2, "name": "Podcast", "item": "https://talkinflag.com/podcast" },
      { "@type": "ListItem", "position": 3, "name": episode.guestName || episode.title, "item": `https://talkinflag.com/podcast/${id}` },
    ],
  };

  // JSON-LD for podcast episode
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    "name": episode.title,
    "description": episode.description.slice(0, 500),
    "url": `https://talkinflag.com/podcast/${id}`,
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
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Back navigation */}
        <Link
          href="/podcast"
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
          <time dateTime={episode.publishedAt} className="text-brand-white/40 text-sm">
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
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
              `https://talkinflag.com/podcast/${id}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-brand-white/20 text-brand-white/60 font-display text-xs uppercase tracking-widest px-4 py-2 hover:border-brand-white/40 hover:text-brand-white transition-colors"
            aria-label="Share on LinkedIn"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            Share on LinkedIn
          </a>
          <ShareButton title={episode.guestName || episode.title} />
        </div>

        {/* Topic tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {tags.map((tag) => (
              <span
                key={tag}
                className="border border-brand-white/15 text-brand-white/50 text-xs font-display uppercase tracking-widest px-3 py-1"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Guest intro (first paragraph as highlighted bio) */}
        {guestIntro && (
          <div className="border-l-4 border-brand-yellow pl-5 mb-8">
            <p className="text-brand-white/30 text-xs font-display uppercase tracking-widest mb-2">
              About the Guest
            </p>
            <p className="text-brand-white/80 leading-relaxed italic">{guestIntro}</p>
          </div>
        )}

        {/* Show notes */}
        <div className="mb-8">
          <h2 className="font-display text-xs uppercase tracking-widest text-brand-yellow mb-3">
            Show Notes
          </h2>
          <p className="text-brand-white/70 leading-relaxed whitespace-pre-line">
            {showNotes}
          </p>
        </div>

        {/* Related players */}
        {relatedPlayers.length > 0 && (
          <div className="bg-[#0d0d0d] border border-brand-white/10 p-5 mb-8">
            <p className="text-brand-white/30 text-xs font-display uppercase tracking-widest mb-3">
              Featured in Our Database
            </p>
            <div className="flex flex-wrap gap-3">
              {relatedPlayers.map((p) => (
                <a
                  key={p.id}
                  href={`/players/${p.id}`}
                  className="flex items-center gap-2 border border-brand-white/10 px-3 py-2 hover:border-brand-yellow/40 transition-colors group"
                >
                  <span className="text-brand-white text-sm group-hover:text-brand-yellow transition-colors">
                    {p.first_name} {p.last_name}
                  </span>
                  {p.position && (
                    <span className="text-brand-white/30 text-xs">{p.position}</span>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Related episodes */}
        {related.length > 0 && (
          <div className="mt-20 pt-10 border-t border-brand-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl uppercase text-brand-white">More Episodes</h2>
              <Link
                href="/podcast"
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
