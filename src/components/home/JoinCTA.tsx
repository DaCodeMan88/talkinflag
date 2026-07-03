import Link from "next/link";

export function JoinCTA() {
  return (
    <section className="bg-brand-black py-20 px-6 border-t border-brand-white/5" aria-label="Join Talkin Flag">
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
        <Link
          href="/join"
          className="inline-flex items-center justify-center bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm px-10 py-4 hover:bg-yellow-400 transition-colors"
        >
          Join Talkin Flag →
        </Link>
      </div>
    </section>
  );
}
