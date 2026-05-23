import type { Metadata } from "next";
import { Hero } from "@/components/hero/Hero";

export const metadata: Metadata = {
  title: "Talkin Flag | The Global Flag Football Podcast",
  description:
    "Hosted by Ambra & Tika Marcucci of the Italian National Team. 39+ episodes with elite athletes, coaches, and founders building the future of flag football.",
};

export default function HomePage() {
  return (
    <>
      <Hero />
    </>
  );
}
