import Image from "next/image";

export function HostsHero() {
  return (
    <section className="bg-brand-black flex flex-col items-center pt-28 pb-0">
      {/* Section header */}
      <div className="text-center px-6 mb-10">
        <p className="text-brand-yellow font-display text-[10px] uppercase tracking-[0.4em] mb-4">
          Your Hosts
        </p>
        <h1 className="font-display text-5xl sm:text-6xl md:text-8xl uppercase text-brand-white leading-none">
          Ambra &amp; Tika
        </h1>
        <p className="mt-4 text-brand-white/50 text-sm max-w-xs mx-auto leading-relaxed">
          Twin sisters. Italian National Team. The voices of global flag football.
        </p>
      </div>

      {/* Hero photo */}
      <div className="relative flex-shrink-0 w-full max-w-[280px] sm:max-w-[320px] md:max-w-[380px]">
        <Image
          src="/hosts-hero.jpg"
          alt="Ambra & Tika Marcucci — Talkin Flag hosts, Italian National Flag Football Team"
          width={1080}
          height={1725}
          priority
          sizes="(max-width: 640px) 85vw, (max-width: 1024px) 55vw, 380px"
          className="w-full h-auto block"
        />
        {/* Fade image into section below */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-brand-black to-transparent" />
      </div>

      {/* Instagram links */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 pb-10 px-6">
        {[
          { handle: "ambramarcucci", label: "Ambra" },
          { handle: "fit_with_tika", label: "Tika" },
          { handle: "talkinflagshow", label: "Show" },
        ].map(({ handle, label }) => (
          <a
            key={handle}
            href={`https://instagram.com/${handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-brand-yellow font-display uppercase tracking-[0.2em] text-xs hover:underline transition-opacity hover:opacity-80"
            aria-label={`${label} on Instagram`}
          >
            @{handle} ↗
          </a>
        ))}
      </div>
    </section>
  );
}
