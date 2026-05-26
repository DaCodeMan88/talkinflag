import Image from "next/image";

const AMBRA_BIO =
  "Ambra Marcucci brings passion to the mic and is a proud member of the Italian National Flag Football Team. As co-host of Talkin Flag alongside her twin sister Tika, she brings energy and curiosity when connecting with guests, drawing out their stories, motivations, and contributions to the growth of flag football. Ambra holds a doctorate in Psychology and works as a sports agent at Dub Sports & Entertainment.";

const TIKA_BIO =
  "Tika Marcucci forms the other half of the Talkin Flag leadership duo. A fellow Italian National Team athlete, she brings a strong analytical voice to the show — taking notes during each episode and asking thoughtful, targeted questions that deepen the discussion. Tika holds a doctorate in Psychology, has a background in sports psychology, and works as a forensic psychologist.";

const TOGETHER =
  "Together, Ambra and Tika leverage their academic and athletic backgrounds to explore not only how the sport is played, but how athletes think, prepare, and perform under pressure.";

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

      {/* Thumbnail */}
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
        {/* Fade image into panel below */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#111111] to-transparent" />
      </div>

      {/* Bio panel */}
      <div className="w-full max-w-2xl mx-auto px-4 -mt-2 pb-16">
        <div className="bg-[#111111] border border-brand-white/10 p-8 md:p-10">

          {/* Ambra */}
          <div className="mb-7">
            <span className="font-display text-[10px] uppercase tracking-[0.35em] text-brand-yellow block mb-3">
              Ambra Marcucci
            </span>
            <p className="text-brand-white/70 text-sm leading-relaxed">{AMBRA_BIO}</p>
          </div>

          <div className="h-px bg-brand-white/10 mb-7" aria-hidden="true" />

          {/* Tika */}
          <div className="mb-7">
            <span className="font-display text-[10px] uppercase tracking-[0.35em] text-brand-yellow block mb-3">
              Tika Marcucci
            </span>
            <p className="text-brand-white/70 text-sm leading-relaxed">{TIKA_BIO}</p>
          </div>

          <div className="h-px bg-brand-white/10 mb-7" aria-hidden="true" />

          {/* Together */}
          <p className="text-brand-white/55 text-sm leading-relaxed italic">{TOGETHER}</p>
        </div>

        {/* Instagram links */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8">
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
      </div>
    </section>
  );
}
