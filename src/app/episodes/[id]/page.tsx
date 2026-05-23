import { getEpisodes } from "@/lib/youtube";
import { notFound } from "next/navigation";
import { EpisodeCard } from "@/components/episodes/EpisodeCard";
import type { Metadata } from "next";

export const revalidate = 3600;

export async function generateStaticParams() {
  const episodes = await getEpisodes(50);
  return episodes.map((ep) => ({ id: ep.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const episodes = await getEpisodes(50);
  const episode = episodes.find((e) => e.id === id);
  if (!episode) return {};
  return {
    title: `${episode.guestName || episode.title} | Talkin Flag`,
    description: episode.description.slice(0, 160),
  };
}

export default async function EpisodePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const episodes = await getEpisodes(50);
  const episode = episodes.find((e) => e.id === id);
  if (!episode) notFound();

  const related = episodes.filter((e) => e.id !== episode.id).slice(0, 4);

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="aspect-video w-full mb-8">
          <iframe
            src={`https://www.youtube.com/embed/${episode.id}?rel=0&modestbranding=1&autoplay=1`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={episode.title}
          />
        </div>

        {episode.episodeNumber && (
          <p className="font-display text-xs uppercase tracking-widest text-brand-yellow">Episode {episode.episodeNumber}</p>
        )}
        <h1 className="font-display text-3xl md:text-5xl uppercase text-brand-white mt-2 leading-tight">
          {episode.guestName || episode.title}
        </h1>
        <p className="text-brand-white/60 mt-4 leading-relaxed whitespace-pre-line">
          {episode.description}
        </p>

        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-xl uppercase text-brand-yellow mb-6">More Episodes</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map((ep) => <EpisodeCard key={ep.id} episode={ep} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
