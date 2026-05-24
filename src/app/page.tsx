import { Hero } from "@/components/hero/Hero";
import { StatsBar } from "@/components/home/StatsBar";
import { NewsletterSignup } from "@/components/home/NewsletterSignup";
import { ListenOn } from "@/components/home/ListenOn";
import { EventsTeaser } from "@/components/home/EventsTeaser";
import { PlayersSpotlight } from "@/components/home/PlayersSpotlight";
import { BlogTeaser } from "@/components/home/BlogTeaser";
import { getEpisodes } from "@/lib/youtube";
import { EpisodeCard } from "@/components/episodes/EpisodeCard";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Suspense } from "react";

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: "Talkin Flag | The Global Flag Football Podcast",
  description:
    "Hosted by Ambra & Tika Marcucci of the Italian National Team. 39+ episodes with elite athletes, coaches, and founders building the future of flag football.",
  path: "/",
});

export default async function HomePage() {
  // Fetch 50 so we can show an accurate live episode count in StatsBar
  const episodes = await getEpisodes(50);

  // Show 4 on the homepage grid; the rest feed the episode count in StatsBar
  const featuredEpisodes = episodes.slice(0, 4);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Talkin Flag",
          "url": "https://talkinflag.com",
          "logo": "https://talkinflag.com/og-image.png",
          "description": "The global flag football podcast hosted by Ambra & Tika Marcucci of the Italian National Team.",
          "foundingDate": "2023",
          "sameAs": [
            "https://instagram.com/talkinflagshow",
            "https://youtube.com/@thetalkinballsnetwork",
            "https://x.com/TalkinFlagShow",
          ],
        }) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "url": "https://talkinflag.com",
          "name": "Talkin Flag",
          "description": "The global flag football podcast, player rankings, and event calendar.",
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://talkinflag.com/players?q={search_term_string}",
            },
            "query-input": "required name=search_term_string",
          },
        }) }}
      />
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
      <Hero latestEpisode={episodes[0]} episodeCount={episodes.length} />
      <StatsBar episodeCount={episodes.length} />

      <section className="bg-brand-black py-20 px-6" aria-label="Latest episodes">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal direction="up">
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
            {featuredEpisodes.map((ep) => (
              <EpisodeCard key={ep.id} episode={ep} />
            ))}
          </div>
          </ScrollReveal>
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

      <ListenOn />
      {/* Suspense allows EventsTeaser & PlayersSpotlight to stream independently
          so the hero, episodes, and ListenOn sections appear before Supabase resolves */}
      <Suspense fallback={
        <div className="bg-[#0a0a0a] border-t border-brand-white/5 py-20 px-6">
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="h-12 w-64 bg-brand-white/5 animate-pulse rounded-sm" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-brand-white/5 animate-pulse rounded-sm" />
            ))}
          </div>
        </div>
      }>
        <EventsTeaser />
      </Suspense>
      <Suspense fallback={
        <div className="bg-brand-black border-t border-brand-white/5 py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="h-12 w-48 bg-brand-white/5 animate-pulse rounded-sm mb-8" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-40 bg-brand-white/5 animate-pulse rounded-sm" />
              ))}
            </div>
          </div>
        </div>
      }>
        <PlayersSpotlight />
      </Suspense>
      <BlogTeaser />
      <NewsletterSignup />
    </>
  );
}
