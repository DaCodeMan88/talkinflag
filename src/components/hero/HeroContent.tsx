"use client";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Play, ChevronDown } from "lucide-react";
import type { Episode } from "@/types/episode";
// Note: Button is used for the CTA links only; the Watch → link is a plain <Link>

// CSS-driven entrance animation — no GSAP dependency
const fadeIn = (delay: number): React.CSSProperties => ({
  animation: `heroFadeUp 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}s both`,
});

interface HeroContentProps {
  latestEpisode?: Episode;
  episodeCount?: number;
}

export function HeroContent({ latestEpisode, episodeCount }: HeroContentProps) {
  const countLabel = episodeCount ? `${episodeCount}+` : "39+";
  // Build the latest episode label — use dynamic data if available
  const latestLabel = latestEpisode
    ? [
        latestEpisode.episodeNumber ? `Episode ${latestEpisode.episodeNumber}` : null,
        latestEpisode.guestName || latestEpisode.title,
      ]
        .filter(Boolean)
        .join(" — ")
    : "Episode 39 — Phil Cutler: Adria Bowl 2026 Champion";

  const latestHref = latestEpisode ? `/podcast/${latestEpisode.id}` : "/podcast";
  const latestAriaLabel = latestEpisode
    ? `Watch ${latestLabel}`
    : "Watch Episode 39 — Phil Cutler: Adria Bowl 2026 Champion";
  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-6 pt-20">
      {/* Badge */}
      <div style={fadeIn(0.2)} className="inline-flex items-center gap-2 bg-brand-yellow/10 border border-brand-yellow/30 rounded-full px-4 py-1.5 mb-6">
        <span className="w-2 h-2 rounded-full bg-brand-yellow animate-pulse" />
        <span className="font-display text-xs tracking-[0.3em] text-brand-yellow uppercase">
          The Talkin Balls Network
        </span>
      </div>

      {/* Main title */}
      <h1
        style={fadeIn(0.4)}
        className="font-display text-6xl sm:text-8xl md:text-[10rem] lg:text-[12rem] uppercase leading-none tracking-tight text-brand-white"
      >
        TALKIN
        <span
          className="block"
          style={{ WebkitTextStroke: "2px #FDDD58", color: "transparent" }}
        >
          FLAG
        </span>
      </h1>

      {/* Subtitle */}
      <p
        style={fadeIn(0.65)}
        className="mt-6 text-lg md:text-xl text-brand-white/70 max-w-2xl leading-relaxed"
      >
        The global flag football podcast. {countLabel} episodes with elite athletes, coaches, and{" "}
        founders — hosted by{" "}
        <span className="text-brand-yellow font-semibold">Ambra & Tika Marcucci</span>{" "}
        of the <span className="text-brand-yellow">Italian National Team 🇮🇹</span>.
      </p>

      {/* Tag badges */}
      <div style={fadeIn(0.85)} className="flex flex-wrap justify-center gap-3 mt-6">
        {[
          `${countLabel} Episodes`,
          "Global Guests",
          "Mental Performance",
          "Women's Flag Football",
          "Community Foundations",
        ].map((tag) => (
          <span
            key={tag}
            className="px-3 py-1 bg-brand-white/5 border border-brand-white/10 text-brand-white/60 text-xs font-display uppercase tracking-widest rounded-sm"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* CTA buttons */}
      <div style={fadeIn(1.05)} className="flex flex-col sm:flex-row gap-4 mt-10">
        <Link href="/podcast" className="w-full sm:w-auto">
          <Button size="lg" className="w-full sm:w-auto">
            <Play size={18} fill="currentColor" className="mr-2" />
            Watch Episodes
          </Button>
        </Link>
        <Link href="/players" className="w-full sm:w-auto">
          <Button variant="outline" size="lg" className="w-full sm:w-auto">
            Player Rankings
          </Button>
        </Link>
      </div>

      {/* Latest episode strip */}
      <div style={fadeIn(1.2)} className="mt-16 flex items-center gap-3 border border-brand-yellow/20 px-6 py-3 rounded-sm bg-brand-black/60 backdrop-blur-sm max-w-full overflow-hidden">
        <span className="text-xs font-display uppercase tracking-widest text-brand-yellow shrink-0">
          Latest
        </span>
        <span className="w-px h-4 bg-brand-yellow/30 shrink-0" />
        <span className="text-sm text-brand-white/80 truncate">
          {latestLabel}
        </span>
        {/* min-h-[44px] ensures WCAG 2.5.5 touch target size */}
        <Link
          href={latestHref}
          aria-label={latestAriaLabel}
          className="inline-flex items-center min-h-[44px] shrink-0 text-brand-yellow font-display text-sm uppercase tracking-widest hover:opacity-80 transition-opacity"
        >
          Watch →
        </Link>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce" aria-hidden="true">
        <ChevronDown size={24} className="text-brand-yellow/50" />
      </div>
    </div>
  );
}
