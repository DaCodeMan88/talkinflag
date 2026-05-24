import { HeroScene } from "./HeroScene";
import { HeroContent } from "./HeroContent";
import type { Episode } from "@/types/episode";

interface HeroProps {
  latestEpisode?: Episode;
  episodeCount?: number;
}

export function Hero({ latestEpisode, episodeCount }: HeroProps) {
  return (
    <section className="relative min-h-screen overflow-hidden" aria-label="Hero">
      <HeroScene />
      <HeroContent latestEpisode={latestEpisode} episodeCount={episodeCount} />
    </section>
  );
}
