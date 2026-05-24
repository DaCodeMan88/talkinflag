import Image from "next/image";

// NOTE: Based on the photoshoot thumbnail, Ambra is on the LEFT, Tika is on the RIGHT.
// Swap the sides array order below if that turns out to be incorrect.

const HOSTS = [
  {
    name: "Ambra",
    side: "left" as const,
    bio: "Ambra Marcucci brings elite on-field experience to the mic as a proud member of the Italian National Flag Football Team. She co-hosts Talkin Flag with her twin sister Tika, delivering expert analysis, inspiring interviews, and a global perspective on the sport she lives and breathes.",
  },
  {
    name: "Tika",
    side: "right" as const,
    bio: "Tika Marcucci is the other half of the Talkin Flag powerhouse. Sharing the mic and the field with Ambra, Tika brings the same Italian National Team credentials, competitive insight, and infectious energy that has made Talkin Flag the premier flag football podcast globally.",
  },
];

function BioColumn({ name, bio }: { name: string; bio: string }) {
  // Repeat content so the -50% translateY loop is seamless
  const block = (
    <div className="mb-10">
      <span className="block font-display text-[9px] uppercase tracking-[0.25em] text-brand-yellow/50 mb-2">
        {name} Marcucci
      </span>
      <p className="text-[11px] leading-[1.8] text-brand-white/30 font-body">{bio}</p>
    </div>
  );

  const repeats = Array.from({ length: 10 }, (_, i) => (
    <div key={i}>{block}</div>
  ));

  return (
    <div className="relative flex-1 overflow-hidden" aria-hidden="true">
      {/* Scrolling inner — duplicated so the loop is invisible */}
      <div className="animate-scroll-bio" style={{ willChange: "transform" }}>
        {repeats}
        {repeats}
      </div>
      {/* Fade edges so text dissolves in/out naturally */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-brand-black to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-brand-black to-transparent" />
    </div>
  );
}

export function HostsHero() {
  return (
    <section className="min-h-screen bg-brand-black flex flex-col items-center pt-28 pb-0">
      {/* Section header */}
      <div className="text-center px-6 mb-10">
        <p className="text-brand-yellow font-display text-[10px] uppercase tracking-[0.4em] mb-4">
          Your Hosts
        </p>
        <h1 className="font-display text-5xl sm:text-6xl md:text-8xl uppercase text-brand-white leading-none">
          Ambra & Tika
        </h1>
        <p className="mt-4 text-brand-white/50 text-sm max-w-xs mx-auto leading-relaxed">
          Twin sisters. Italian National Team. The voices of global flag football.
        </p>
      </div>

      {/* Three-column layout: bio | image | bio */}
      <div className="flex items-start justify-center w-full max-w-5xl px-4 mx-auto">
        {/* Left bio — Ambra */}
        <div
          className="hidden lg:flex flex-col w-44 xl:w-52 pr-5 overflow-hidden self-stretch"
          style={{ minHeight: 560 }}
        >
          <BioColumn name="Ambra" bio={HOSTS[0].bio} />
        </div>

        {/* Center: full photoshoot thumbnail (natural dimensions) */}
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
          {/* Fade image into the section below */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-brand-black via-brand-black/50 to-transparent" />
        </div>

        {/* Right bio — Tika */}
        <div
          className="hidden lg:flex flex-col w-44 xl:w-52 pl-5 overflow-hidden self-stretch"
          style={{ minHeight: 560 }}
        >
          <BioColumn name="Tika" bio={HOSTS[1].bio} />
        </div>
      </div>

      {/* Single show link */}
      <div className="mt-8 pb-14 text-center">
        <a
          href="https://instagram.com/talkinflagshow"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-brand-yellow font-display uppercase tracking-[0.25em] text-xs hover:underline transition-opacity hover:opacity-80"
          aria-label="Talkin Flag Show on Instagram"
        >
          @talkinflagshow ↗
        </a>
      </div>
    </section>
  );
}
