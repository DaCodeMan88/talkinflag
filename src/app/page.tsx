import { Hero } from "@/components/hero/Hero";
import { StatsBar } from "@/components/home/StatsBar";
import { NewsletterSignup } from "@/components/home/NewsletterSignup";
import { getEpisodes } from "@/lib/youtube";
import { EpisodeCard } from "@/components/episodes/EpisodeCard";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: "Talkin Flag | The Global Flag Football Podcast",
  description:
    "Hosted by Ambra & Tika Marcucci of the Italian National Team. 39+ episodes with elite athletes, coaches, and founders building the future of flag football.",
});

export default async function HomePage() {
  const episodes = await getEpisodes(4);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "PodcastSeries",
          "name": "Talkin Flag",
          "description": "The global flag football podcast hosted by Ambra & Tika Marcucci of the Italian National Team.",
          "url": "https://talkinflag.com",
          "image": "https://talkinflag.com/og-image.png",
          "author": [
            { "@type": "Person", "name": "Ambra Marcucci" },
            { "@type": "Person", "name": "Tika Marcucci" }
          ]
        }) }}
      />
      <Hero />
      <StatsBar />

      <section className="bg-brand-black py-20 px-6" aria-label="Latest episodes">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <h2 className="font-display text-4xl md:text-6xl uppercase text-brand-white">
              Latest Episodes
            </h2>
            <Link
              href="/episodes"
              className="text-brand-yellow font-display uppercase tracking-widest text-sm hover:underline hidden md:block"
            >
              All Episodes →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {episodes.map((ep) => (
              <EpisodeCard key={ep.id} episode={ep} />
            ))}
          </div>
          <div className="mt-6 text-center md:hidden">
            <Link
              href="/episodes"
              className="text-brand-yellow font-display uppercase tracking-widest text-sm hover:underline"
            >
              All Episodes →
            </Link>
          </div>
        </div>
      </section>

      <NewsletterSignup />
    </>
  );
}
