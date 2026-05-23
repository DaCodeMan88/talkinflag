"use client";
import { Episode } from "@/types/episode";
import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function EpisodeCard({ episode }: { episode: Episode }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link href={`/episodes/${episode.id}`} aria-label={`Watch ${episode.title}`}>
      <div
        className={cn(
          "group relative bg-[#222222] border border-brand-white/10 overflow-hidden transition-all duration-300",
          hovered && "border-brand-yellow/60 -translate-y-1 shadow-2xl shadow-brand-yellow/10"
        )}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={episode.thumbnail || "/placeholder-thumb.jpg"}
            alt={episode.title}
            fill
            className={cn(
              "object-cover transition-transform duration-500",
              hovered && "scale-105"
            )}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          <div className={cn(
            "absolute inset-0 bg-brand-black/60 flex items-center justify-center transition-opacity duration-300",
            hovered ? "opacity-100" : "opacity-0"
          )}>
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
          {episode.guestName && (
            <p className="text-brand-yellow font-display text-xs uppercase tracking-widest mb-1">
              {episode.guestName}
            </p>
          )}
          <h3 className="text-brand-white text-sm font-medium line-clamp-2 leading-snug">
            {episode.title}
          </h3>
          <p className="text-brand-white/40 text-xs mt-2">
            {new Date(episode.publishedAt).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
            })}
          </p>
        </div>
      </div>
    </Link>
  );
}
