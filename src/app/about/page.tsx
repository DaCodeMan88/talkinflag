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

export default function AboutPage() {
  return (
    <div className="bg-brand-black">
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
                bio: "Ambra Marcucci brings elite on-field experience to the mic as a proud member of the Italian National Flag Football Team. She co-hosts Talkin Flag with her twin sister Tika, delivering expert analysis, inspiring interviews, and a global perspective on the sport she lives and breathes.",
                flag: "🇮🇹",
                instagram: "@ambramarcu",
                image: "/ambra.jpg",
              }}
            />
            <HostCard
              host={{
                name: "Tika Marcucci",
                title: "Co-Host · Italian National Team",
                bio: "Tika Marcucci is the other half of the Talkin Flag powerhouse. Sharing the mic and the field with Ambra, Tika brings the same Italian National Team credentials, competitive insight, and infectious energy that has made Talkin Flag the premier flag football podcast globally.",
                flag: "🇮🇹",
                instagram: "@tikamarcu",
                image: "/tika.jpg",
              }}
            />
          </div>
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
