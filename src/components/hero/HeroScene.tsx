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

function HeroSceneFallback() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${(i * 17 + 5) % 100}%`,
    top: `${(i * 23 + 10) % 100}%`,
    delay: `${(i * 0.3) % 6}s`,
    duration: `${4 + (i % 4)}s`,
  }));

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#050a00]">
      {Array.from({ length: 10 }, (_, i) => (
        <div
          key={i}
          className="absolute left-0 right-0 border-t border-brand-yellow/10"
          style={{ top: `${10 + i * 9}%` }}
        />
      ))}
      {particles.map((p) => (
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
