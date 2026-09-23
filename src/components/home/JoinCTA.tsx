import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function JoinCTA() {
  return (
    <section className="grain-overlay bg-brand-black py-20 px-6 border-t border-brand-white/5" aria-label="Join Talkin Flag">
      <div className="max-w-4xl mx-auto text-center">
        <p className="font-display text-brand-yellow text-xs uppercase tracking-[0.3em] mb-3">
          Free · Always
        </p>
        <h2 className="font-display text-4xl md:text-6xl uppercase text-brand-white mb-5">
          Get Discovered
        </h2>
        <p className="text-brand-white/50 text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          Join the global flag football database — visible to college coaches, scouts, and national team selectors worldwide.
        </p>
        {/* Same Link-wraps-Button pattern as HeroContent. tabIndex -1 keeps a
            single tab stop (the link) instead of two for one action. */}
        <Link href="/join" className="inline-block">
          <Button size="lg" tabIndex={-1} className="tracking-widest">
            Join Talkin Flag →
          </Button>
        </Link>
      </div>
    </section>
  );
}
