"use client";
import dynamic from "next/dynamic";

const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-brand-black" />,
});

export function HeroScene() {
  const splineUrl = process.env.NEXT_PUBLIC_SPLINE_SCENE_URL;

  if (!splineUrl) {
    return <HeroSceneFallback />;
  }

  return (
    <div className="absolute inset-0 z-0">
      <Spline scene={splineUrl} className="w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-b from-brand-black/40 via-brand-black/20 to-brand-black" />
    </div>
  );
}

// Reduced to 8 particles (was 20) and 6 grid lines (was 10) to lower layout/paint cost
const PARTICLES = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  left: `${(i * 23 + 5) % 100}%`,
  top: `${(i * 31 + 10) % 100}%`,
  delay: `${(i * 0.5) % 4}s`,
  duration: `${5 + (i % 3)}s`,
}));

function HeroSceneFallback() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#050a00]">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="absolute left-0 right-0 border-t border-brand-yellow/10"
          style={{ top: `${12 + i * 14}%` }}
        />
      ))}
      {PARTICLES.map((p) => (
        <div
          key={p.id}
          className="absolute w-2 h-3 bg-brand-yellow/30 animate-float"
          style={{
            left: p.left,
            top: p.top,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-black/60 via-transparent to-brand-black" />
    </div>
  );
}
