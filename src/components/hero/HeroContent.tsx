"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Play, ChevronDown } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export function HeroContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const badgesRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(titleRef.current, { y: 60, opacity: 0, duration: 1, delay: 0.3 })
        .from(subRef.current, { y: 40, opacity: 0, duration: 0.8 }, "-=0.5")
        .from(badgesRef.current, { y: 30, opacity: 0, duration: 0.8 }, "-=0.5")
        .from(ctaRef.current, { y: 20, opacity: 0, duration: 0.8 }, "-=0.5");

      gsap.to(containerRef.current, {
        y: -150,
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-6 pt-20"
    >
      <div className="inline-flex items-center gap-2 bg-brand-yellow/10 border border-brand-yellow/30 rounded-full px-4 py-1.5 mb-6">
        <span className="w-2 h-2 rounded-full bg-brand-yellow animate-pulse" />
        <span className="font-display text-xs tracking-[0.3em] text-brand-yellow uppercase">
          The Talkin Balls Network
        </span>
      </div>

      <h1
        ref={titleRef}
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

      <p
        ref={subRef}
        className="mt-6 text-lg md:text-xl text-brand-white/70 max-w-2xl leading-relaxed"
      >
        The global flag football podcast. 39+ episodes with elite athletes, coaches, and{" "}
        founders — hosted by{" "}
        <span className="text-brand-yellow font-semibold">Ambra & Tika Marcucci</span>{" "}
        of the <span className="text-brand-yellow">Italian National Team 🇮🇹</span>.
      </p>

      <div ref={badgesRef} className="flex flex-wrap justify-center gap-3 mt-6">
        {[
          "39+ Episodes",
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

      <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 mt-10">
        <Link href="/episodes" className="w-full sm:w-auto">
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

      <div className="mt-16 flex items-center gap-3 border border-brand-yellow/20 px-6 py-3 rounded-sm bg-brand-black/60 backdrop-blur-sm">
        <span className="text-xs font-display uppercase tracking-widest text-brand-yellow">
          Latest
        </span>
        <span className="w-px h-4 bg-brand-yellow/30" />
        <span className="text-sm text-brand-white/80">
          Episode 39 — Phil Cutler: Adria Bowl 2026 Champion
        </span>
        <Link href="/episodes" aria-label="Watch Episode 39 — Phil Cutler: Adria Bowl 2026 Champion">
          <Button variant="ghost" size="sm" aria-hidden="true" tabIndex={-1}>
            Watch →
          </Button>
        </Link>
      </div>

      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce"
        aria-hidden="true"
      >
        <ChevronDown size={24} className="text-brand-yellow/50" />
      </div>
    </div>
  );
}
