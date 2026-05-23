import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Talkin Flag | The Global Flag Football Podcast",
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-brand-black text-brand-white flex items-center justify-center">
      <h1 className="font-display text-2xl uppercase tracking-widest text-brand-yellow">Talkin Flag</h1>
    </main>
  );
}
