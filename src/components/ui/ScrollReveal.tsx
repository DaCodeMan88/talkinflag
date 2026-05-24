"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: "up" | "left" | "right" | "scale";
  delay?: number;
  className?: string;
}

export function ScrollReveal({
  children, direction = "up", delay = 0, className = "",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const from: gsap.TweenVars = {
      opacity: 0,
      duration: 0.8,
      delay,
      ease: "power3.out",
    };

    if (direction === "up") from.y = 50;
    if (direction === "left") from.x = -50;
    if (direction === "right") from.x = 50;
    if (direction === "scale") from.scale = 0.9;

    const anim = gsap.from(el, {
      ...from,
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        toggleActions: "play none none none",
      },
    });

    return () => {
      anim.kill();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [direction, delay]);

  return <div ref={ref} className={className}>{children}</div>;
}
