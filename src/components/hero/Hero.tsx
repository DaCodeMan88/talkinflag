import { HeroScene } from "./HeroScene";
import { HeroContent } from "./HeroContent";

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden" aria-label="Hero">
      <HeroScene />
      <HeroContent />
    </section>
  );
}
