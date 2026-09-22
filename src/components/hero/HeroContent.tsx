"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Play, ChevronDown } from "lucide-react";
import type { Episode } from "@/types/episode";

const fadeIn = (delay: number): React.CSSProperties => ({
  animation: `heroFadeUp 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}s both`,
});

// Distance (px) over which the twins+headline block fades from opaque to
// fully transparent — matches the point past which the hero has largely
// scrolled out of view anyway.
const TWINS_FADE_DISTANCE_PX = 500;
const TWINS_DRIFT_RATE = 0.25;
// Cap on the twins/headline block's own scroll-linked translateY, DERIVED
// from the fade distance/rate so drift and fade always complete together at
// the same scroll depth (500 * 0.25 = 125px). A cap reached earlier than the
// fade finishes looks broken — the block freezes in place (only opacity still
// changing) for the back half of its fade. This block has generous headroom
// below it (subtitle, tags, CTAs, latest-episode strip, chevron are all
// unaffected by scroll — see note below), so even this larger, synced cap
// never risks colliding with anything.
const MAX_TWINS_DRIFT_PX = TWINS_FADE_DISTANCE_PX * TWINS_DRIFT_RATE;
// How long the post-entrance "catch-up" transition runs — see handleEntranceEnd.
const CATCH_UP_TRANSITION_MS = 200;

interface HeroContentProps {
  latestEpisode?: Episode;
  episodeCount?: number;
}

export function HeroContent({ latestEpisode, episodeCount }: HeroContentProps) {
  const twinsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // The twins/headline row renders with an inline `animation` (heroFadeUp,
    // fill-mode "both") for its entrance. A CSS animation's keyframe values
    // take precedence over any value written directly to the same style
    // property via JS for as long as the animation is in effect — and
    // "both" keeps it in effect indefinitely after it finishes, not just
    // during the 0.9s it plays. Writing `style.opacity`/`style.transform`
    // on that element before the animation ends (or without ever clearing
    // it) would silently do nothing — the animation would keep pinning
    // opacity/transform to their end-state values. So: wait for the
    // entrance animation to finish, then drop the inline `animation`
    // property (its held end state is opacity:1/transform:none, identical
    // to the element's un-animated default, so this causes no visual jump)
    // before letting scroll-driven styles take over.
    let entranceSettled = false;
    const twinsEl = twinsRef.current;
    let frame = 0;
    let catchUpTimer = 0;

    function applyParallax() {
      if (!twinsRef.current || !entranceSettled) return;
      // Read window.scrollY live rather than caching it in a ref updated by
      // the scroll listener: a ref only updated by a `scroll` event handler
      // can be stale at exactly the moment this fires from handleEntranceEnd,
      // because a programmatic scroll (or even a user scroll under load) can
      // change window.scrollY before the browser gets around to dispatching
      // the `scroll` event — confirmed empirically while testing this fix
      // (window.scrollTo moved window.scrollY immediately, but a same-tick
      // ref-cache stayed stale for several seconds until the event caught
      // up). window.scrollY itself has no such lag; it's always accurate.
      const y = window.scrollY;
      // Deviation from the task's literal reference code: the reference put
      // the translateY drift on the OUTERMOST hero container (badge, headline,
      // subtitle, tags, CTAs, latest-episode strip, chevron — everything).
      // Measured in-browser, that container is exactly as tall as its content
      // (no bottom slack — the chevron sits at `bottom-8`) and renders in its
      // own stacking context (`relative z-10`). Any positive translateY on it
      // therefore paints its bottom edge (chevron + tail of the episode strip)
      // on top of the next section's content for a real range of scroll
      // positions — a visible overlap bug, not just a theoretical one. The
      // twins+headline block has generous headroom below it, so scoping both
      // the fade AND the drift to just this block (instead of the whole
      // container) delivers the "twins/headline drift as you scroll" effect
      // the task asks for, keeps the CTAs completely untouched by scroll (as
      // the task separately requires), and can't ever bleed into the next
      // section.
      const drift = Math.min(y * TWINS_DRIFT_RATE, MAX_TWINS_DRIFT_PX);
      twinsRef.current.style.transform = `translateY(${drift}px)`;
      twinsRef.current.style.opacity = `${Math.max(0, 1 - y / TWINS_FADE_DISTANCE_PX)}`;
    }

    const handleEntranceEnd = (event?: Event) => {
      // `animationend` bubbles — ignore one that didn't originate on this
      // element itself (no child here has its own animation today, but this
      // is cheap insurance against that changing later).
      if (event && event.target !== twinsEl) return;
      if (entranceSettled) return;
      entranceSettled = true;
      window.clearTimeout(fallbackTimer);
      if (twinsEl) {
        twinsEl.style.animation = "";
        // Force a style flush so the browser commits the reverted
        // (opacity:1/transform:none) state as a real "before" frame before
        // we add a transition + new target values below — otherwise the
        // two changes can get coalesced into a single un-transitioned jump.
        void twinsEl.offsetHeight;
        // applyParallax() (called below) reads window.scrollY live, so this
        // first application already reflects wherever the user has actually
        // scrolled to — even if that's mid-entrance — rather than "no scroll
        // happened." That alone doesn't fully prevent a visible pop though:
        // while the entrance animation was still in effect, applyParallax()
        // was a no-op (see its guard clause), so the block was visually
        // pinned at opacity:1/transform:none the whole time even as the user
        // scrolled. The very first write below can therefore still be a
        // large jump (e.g. straight to 40% opacity + full drift) in a single
        // frame. A short transition turns that unavoidable first catch-up
        // into a quick, deliberate-looking motion instead of a snap. It's
        // cleared right after so it never interferes with normal rAF-driven
        // scroll updates (which should track the pointer/scroll immediately,
        // not lag behind a transition).
        twinsEl.style.transition = `opacity ${CATCH_UP_TRANSITION_MS}ms ease-out, transform ${CATCH_UP_TRANSITION_MS}ms ease-out`;
      }
      applyParallax();
      catchUpTimer = window.setTimeout(() => {
        if (twinsEl) twinsEl.style.transition = "";
      }, CATCH_UP_TRANSITION_MS + 20);
    };
    twinsEl?.addEventListener("animationend", handleEntranceEnd);
    // Safety net: the entrance animation's delay+duration is fixed (0.4s + 0.9s),
    // so a timer is a reliable fallback if `animationend` is ever missed (e.g. a
    // backgrounded/throttled tab, or the element being detached mid-animation).
    const fallbackTimer = window.setTimeout(() => handleEntranceEnd(), 1400);

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(applyParallax);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      twinsEl?.removeEventListener("animationend", handleEntranceEnd);
      window.clearTimeout(fallbackTimer);
      window.clearTimeout(catchUpTimer);
      cancelAnimationFrame(frame);
    };
  }, []);

  const countLabel = episodeCount ? `${episodeCount}+` : "39+";
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

      {/* Title row — twins flank the headline inline */}
      <div ref={twinsRef} style={fadeIn(0.4)} className="flex items-center justify-center gap-0">
        {/* Ambra (#16) — gazes right toward text */}
        <div
          className="block shrink-0 select-none pointer-events-none"
          style={{
            maskImage: "linear-gradient(to right, black 75%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to right, black 75%, transparent 100%)",
          }}
        >
          <Image
            src="/twin-left.png"
            alt="Ambra Marcucci"
            width={768}
            height={2048}
            className="h-[7.5rem] sm:h-[12rem] md:h-[20rem] lg:h-[24rem] w-auto object-contain"
            priority
          />
        </div>

        <h1 className="font-display text-6xl sm:text-8xl md:text-[10rem] lg:text-[12rem] uppercase leading-none tracking-tight text-brand-white">
          TALKIN
          <span
            className="block"
            style={{ WebkitTextStroke: "2px #FDDD58", color: "transparent" }}
          >
            FLAG
          </span>
        </h1>

        {/* Tika (#12) — gazes left toward text */}
        <div
          className="block shrink-0 select-none pointer-events-none"
          style={{
            maskImage: "linear-gradient(to left, black 75%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to left, black 75%, transparent 100%)",
          }}
        >
          <Image
            src="/twin-right.png"
            alt="Tika Marcucci"
            width={768}
            height={2048}
            className="h-[7.5rem] sm:h-[12rem] md:h-[20rem] lg:h-[24rem] w-auto object-contain"
            priority
          />
        </div>
      </div>

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
