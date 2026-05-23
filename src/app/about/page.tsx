import { HostCard } from "@/components/hosts/HostCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | Talkin Flag — Ambra & Tika Marcucci",
  description: "Meet your hosts: Ambra & Tika Marcucci, twin sisters and members of the Italian National Flag Football Team.",
};

const hosts = [
  {
    name: "Ambra Marcucci",
    title: "Co-Host & Italian National Team",
    bio: "Ambra Marcucci brings elite on-field experience to the mic as a proud member of the Italian National Flag Football Team. She co-hosts Talkin Flag with her twin sister Tika, delivering expert analysis, inspiring interviews, and a global perspective on the sport she lives and breathes.",
    flag: "🇮🇹",
    instagram: "@ambramarcucci",
    image: "/ambra.jpg",
  },
  {
    name: "Tika Marcucci",
    title: "Co-Host & Italian National Team",
    bio: "Tika Marcucci is the other half of the Talkin Flag powerhouse. Sharing the mic and the field with Ambra, Tika brings the same Italian National Team credentials, competitive insight, and infectious energy that has made Talkin Flag the premier flag football podcast globally.",
    flag: "🇮🇹",
    instagram: "@tikamarcucci",
    image: "/tika.jpg",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="font-display text-5xl md:text-7xl uppercase text-brand-white">
            Meet Your Hosts
          </h1>
          <p className="mt-4 text-brand-white/60 text-lg max-w-xl mx-auto">
            Twin sisters. Italian National Team. The voices of global flag football.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
          {hosts.map((host) => (
            <HostCard key={host.name} host={host} />
          ))}
        </div>

        <div className="text-center border border-brand-yellow/20 p-12 bg-[#222222]">
          <p className="text-brand-yellow font-display uppercase tracking-widest text-sm mb-3">Part of</p>
          <h2 className="font-display text-4xl uppercase text-brand-white">The Talkin Balls Network</h2>
          <p className="mt-4 text-brand-white/60 max-w-lg mx-auto">
            Talkin Flag is part of The Talkin Balls Network — a sports media network dedicated to growing flag football culture worldwide.
          </p>
          <a
            href="https://youtube.com/@thetalkinballsnetwork"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-6 text-brand-yellow font-display uppercase tracking-widest text-sm hover:underline"
          >
            Visit The Talkin Balls Network ↗
          </a>
        </div>
      </div>
    </div>
  );
}
