import { Episode } from "@/types/episode";
import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";

export function EpisodeCard({ episode }: { episode: Episode }) {
  return (
    <Link href={`/episodes/${episode.id}`} aria-label={`Watch ${episode.title}`} className="group">
      <div className="relative bg-[#222222] border border-brand-white/10 overflow-hidden transition-all duration-300 group-hover:border-brand-yellow/60 group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-brand-yellow/10">
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={episode.thumbnail || "/placeholder-thumb.jpg"}
            alt={episode.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          <div className="absolute inset-0 bg-brand-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-16 h-16 rounded-full bg-brand-yellow flex items-center justify-center">
              <Play size={24} className="text-brand-black ml-1" fill="currentColor" />
            </div>
          </div>
          {episode.episodeNumber && (
            <div className="absolute top-3 left-3 bg-brand-yellow text-brand-black font-display text-xs px-2 py-1 uppercase tracking-widest">
              Ep {episode.episodeNumber}
            </div>
          )}
        </div>

        <div className="p-4">
          {episode.guestName ? (
            <>
              <h3 className="font-display text-base uppercase text-brand-white leading-tight group-hover:text-brand-yellow transition-colors">
                {episode.guestName}
              </h3>
              <p className="text-brand-white/50 text-xs mt-1 line-clamp-2 leading-snug">
                {episode.title}
              </p>
            </>
          ) : (
            <h3 className="text-brand-white text-sm font-medium line-clamp-2 leading-snug group-hover:text-brand-yellow transition-colors">
              {episode.title}
            </h3>
          )}
          <p className="text-brand-white/30 text-xs mt-2">
            {new Date(episode.publishedAt).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
            })}
          </p>
        </div>
      </div>
    </Link>
  );
}
