"use client";
import { createContext, useContext, useState, useCallback } from "react";
import { Episode } from "@/types/episode";
import { Play, Pause, X } from "lucide-react";
import Image from "next/image";

interface PlayerState {
  episode: Episode | null;
  playing: boolean;
  play: (episode: Episode) => void;
  pause: () => void;
  close: () => void;
}

const PlayerContext = createContext<PlayerState>({
  episode: null, playing: false,
  play: () => {}, pause: () => {}, close: () => {},
});

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [playing, setPlaying] = useState(false);

  const play = useCallback((ep: Episode) => {
    setEpisode(ep);
    setPlaying(true);
  }, []);

  return (
    <PlayerContext.Provider value={{
      episode, playing,
      play,
      pause: () => setPlaying(false),
      close: () => { setEpisode(null); setPlaying(false); },
    }}>
      {children}
      {episode && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#111111] border-t border-brand-yellow/30 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
            <Image src={episode.thumbnail} alt={episode.title} width={48} height={48} className="object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-brand-yellow text-xs font-display uppercase truncate">Now Playing</p>
              <p className="text-brand-white text-sm truncate">{episode.title}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPlaying((p) => !p)}
                className="text-brand-yellow hover:text-yellow-400"
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button
                onClick={() => { setEpisode(null); setPlaying(false); }}
                className="text-brand-white/40 hover:text-brand-white"
                aria-label="Close player"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => useContext(PlayerContext);
