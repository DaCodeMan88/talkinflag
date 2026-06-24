import { safeJsonLd } from "@/lib/jsonld";
import { HostsHero } from "@/components/hosts/HostsHero";
import { HostCard } from "@/components/hosts/HostCard";
import { SubscribePanel } from "@/components/hosts/SubscribePanel";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About | Talkin Flag — Ambra & Tika Marcucci",
  description:
    "Hosted by Ambra & Tika Marcucci of the Italian National Flag Football Team. Twin sisters bringing elite flag football insight to the world.",
  path: "/about",
});

const ambraJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Ambra Marcucci",
  "url": "https://talkinflag.com/about",
  "jobTitle": "Flag Football Podcast Host",
  "description": "Co-host of Talkin Flag, member of the Italian National Flag Football Team, Doctor of Psychology, and sports agent at Dub Sports & Entertainment.",
  "nationality": { "@type": "Country", "name": "Italy" },
  "sameAs": ["https://instagram.com/ambramarcucci"],
  "worksFor": {
    "@type": "Organization",
    "name": "Talkin Flag",
    "url": "https://talkinflag.com",
  },
};

const tikaJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Tika Marcucci",
  "url": "https://talkinflag.com/about",
  "jobTitle": "Flag Football Podcast Host",
  "description": "Co-host of Talkin Flag, member of the Italian National Flag Football Team, Doctor of Psychology, sports psychologist, and forensic psychologist.",
  "nationality": { "@type": "Country", "name": "Italy" },
  "sameAs": ["https://instagram.com/fit_with_tika"],
  "worksFor": {
    "@type": "Organization",
    "name": "Talkin Flag",
    "url": "https://talkinflag.com",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://talkinflag.com" },
    { "@type": "ListItem", "position": 2, "name": "About", "item": "https://talkinflag.com/about" },
  ],
};

export default function AboutPage() {
  return (
    <div className="bg-brand-black">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(ambraJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(tikaJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }} />
      {/* 1 ─ Twin hero: full photoshoot thumbnail + scrolling bio columns */}
      <HostsHero />

      {/* 2 ─ Meet the Hosts */}
      <section className="bg-brand-black px-6 pt-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <p className="text-brand-yellow font-display text-[10px] uppercase tracking-[0.4em] mb-4 text-center">
            Your Hosts
          </p>
          <h2 className="font-display text-3xl md:text-4xl uppercase text-brand-white text-center mb-12">
            Meet Ambra &amp; Tika
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <HostCard
              host={{
                name: "Ambra Marcucci",
                title: "Co-Host · Italian National Team",
                bio: "Ambra Marcucci brings passion to the mic and is a proud member of the Italian National Flag Football Team. As co-host of Talkin Flag alongside her twin sister Tika, she brings energy and curiosity when connecting with guests, drawing out their stories, motivations, and contributions to the growth of flag football. Ambra holds a doctorate in Psychology and works as a sports agent at Dub Sports & Entertainment.",
                flag: "🇮🇹",
                instagram: "@ambramarcucci",
                image: "/ambra.jpg",
              }}
            />
            <HostCard
              host={{
                name: "Tika Marcucci",
                title: "Co-Host · Italian National Team",
                bio: "Tika Marcucci forms the other half of the Talkin Flag leadership duo. A fellow Italian National Team athlete, she brings a strong analytical voice to the show — taking notes during each episode and asking thoughtful, targeted questions that deepen the discussion. Tika holds a doctorate in Psychology, has a background in sports psychology, and works as a forensic psychologist.",
                flag: "🇮🇹",
                instagram: "@fit_with_tika",
                image: "/tika.jpg",
              }}
            />
          </div>
          <p className="mt-12 text-brand-white/60 text-center text-base leading-relaxed max-w-2xl mx-auto">
            Together, Ambra and Tika leverage their academic and athletic
            backgrounds to explore not only how the sport is played, but how
            athletes think, prepare, and perform under pressure.
          </p>
        </div>
      </section>

      {/* 3 ─ Watch & subscribe: latest episode embed + platform links */}
      <SubscribePanel />

      {/* 4 ─ Talkin Balls Network: smooth continuation of the dark panel */}
      <div className="bg-brand-black px-6 pb-20">
        <div className="max-w-3xl mx-auto border-t border-brand-yellow/10 pt-16">
          <div className="text-center border border-brand-yellow/20 p-10 md:p-14 bg-[#111111]">
            <p className="text-brand-yellow font-display text-[10px] uppercase tracking-[0.4em] mb-4">
              Part of
            </p>
            <h2 className="font-display text-3xl md:text-4xl uppercase text-brand-white leading-none">
              The Talkin Balls Network
            </h2>
            <p className="mt-5 text-brand-white/50 text-sm max-w-md mx-auto leading-relaxed">
              Talkin Flag is part of The Talkin Balls Network — a sports media
              network dedicated to growing flag football culture worldwide.
            </p>
            <a
              href="https://youtube.com/@thetalkinballsnetwork"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-7 text-brand-yellow font-display uppercase tracking-[0.25em] text-xs hover:underline"
            >
              Visit The Talkin Balls Network ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
