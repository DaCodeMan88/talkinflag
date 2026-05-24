import { HostsHero } from "@/components/hosts/HostsHero";
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

      {/* 2 ─ Watch & subscribe: latest episode embed + platform links */}
      <SubscribePanel />

      {/* 3 ─ Talkin Balls Network: smooth continuation of the dark panel */}
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
