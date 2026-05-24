"use client";
import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";

interface YouTubeFacadeProps {
  videoId: string;
  title: string;
}

/**
 * Click-to-load YouTube facade.
 * Shows a thumbnail on first render; replaces with the real iframe only after user clicks.
 * Prevents YouTube's third-party scripts from loading on page init (improves LCP + TBT).
 */
export function YouTubeFacade({ videoId, title }: YouTubeFacadeProps) {
  const [loaded, setLoaded] = useState(false);

  if (loaded) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1`}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title={title}
      />
    );
  }

  return (
    <button
      onClick={() => setLoaded(true)}
      className="absolute inset-0 w-full h-full group cursor-pointer"
      aria-label={`Play ${title}`}
    >
      <Image
        src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
        alt={title}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 50vw"
        priority
      />
      {/* Play button overlay */}
      <div className="absolute inset-0 bg-brand-black/30 group-hover:bg-brand-black/10 transition-colors flex items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-brand-yellow flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-200">
          <Play size={32} className="text-brand-black ml-1.5" fill="currentColor" />
        </div>
      </div>
    </button>
  );
}
