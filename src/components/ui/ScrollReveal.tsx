"use client";
import { useEffect, useRef } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: "up" | "left" | "right" | "scale";
  delay?: number;
  className?: string;
}

const animationName: Record<string, string> = {
  up: "revealUp",
  left: "revealLeft",
  right: "revealRight",
  scale: "revealScale",
};

export function ScrollReveal({
  children, direction = "up", delay = 0, className = "",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Start hidden
    el.style.opacity = "0";

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        el.style.animation = `${animationName[direction]} 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s both`;
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [direction, delay]);

  return <div ref={ref} className={className}>{children}</div>;
}
