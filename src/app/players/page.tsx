import { safeJsonLd } from "@/lib/jsonld";
import { createServerClient } from "@/lib/supabase";
import { PlayersFilter } from "@/components/players/PlayersFilter";
import { buildMetadata } from "@/lib/seo";
import Link from "next/link";
import { Suspense } from "react";
import type { Player } from "@/types/player";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "Players | Talkin Flag — Flag Football Rankings",
  description: "The global flag football player database. Rankings, stats, and highlights.",
  path: "/players",
});

export default async function PlayersPage() {
  const supabase = createServerClient();

  // Show ranked players first, then the rest — verified or with a ranking
  const [{ data: players }, { data: interestCounts }] = await Promise.all([
    supabase
      .from("players")
      .select("*")
      .eq("is_approved", true)
      .or("is_verified.eq.true,ranking_national.not.is.null")
      .order("ranking_national", { ascending: true, nullsFirst: false })
      .limit(300) as unknown as Promise<{ data: Player[] | null }>,
    supabase
      .from("recruiting_interests")
      .select("player_id"),
  ]);

  // Count interests per player
  const interestMap = new Map<string, number>();
  for (const row of interestCounts ?? []) {
    interestMap.set(row.player_id, (interestMap.get(row.player_id) ?? 0) + 1);
  }

  const playerList = (players ?? []).map((p) => ({
    ...p,
    interest_count: interestMap.get(p.id) ?? 0,
  }));

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://talkinflag.com" },
      { "@type": "ListItem", "position": 2, "name": "Players", "item": "https://talkinflag.com/players" },
    ],
  };

  // Only include ranked players in the ItemList to keep the JSON-LD focused
  const rankedPlayers = playerList.filter((p) => p.ranking_national != null).slice(0, 50);
  const itemListJsonLd = rankedPlayers.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Talkin Flag Flag Football Player Rankings",
        "url": "https://talkinflag.com/players",
        "itemListElement": rankedPlayers.map((p, i) => ({
          "@type": "ListItem",
          "position": i + 1,
          "name": `${p.first_name} ${p.last_name}${p.position ? ` (${p.position})` : ""}`,
          "url": `https://talkinflag.com/players/${p.id}`,
        })),
      }
    : null;

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListJsonLd) }}
        />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-5xl md:text-7xl uppercase text-brand-white">Players</h1>
              <p className="mt-3 text-brand-white/60">The global flag football player database. Rankings, stats, highlights.</p>
            </div>
            <Link
              href="/players/submit"
              className="shrink-0 inline-flex items-center gap-2 border border-brand-yellow/40 text-brand-yellow font-display text-xs uppercase tracking-widest px-4 py-2 hover:bg-brand-yellow hover:text-brand-black transition-colors mt-2"
            >
              + Submit Profile
            </Link>
          </div>
        </div>

        {playerList.length === 0 ? (
          <div className="text-center py-20 border border-brand-yellow/20 bg-[#111111]">
            <p className="font-display text-2xl uppercase text-brand-yellow mb-3">
              Player Database Coming Soon
            </p>
            <p className="text-brand-white/60 text-sm max-w-md mx-auto">
              The Talkin Flag player database is being built. Submit your profile to be the first listed.
            </p>
            <Link
              href="/players/submit"
              className="inline-block mt-6 bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm px-6 py-3 hover:bg-yellow-400 transition-colors"
            >
              Submit Your Profile
            </Link>
          </div>
        ) : (
          <Suspense fallback={
            <div className="text-brand-white/40 text-sm py-8 text-center font-display uppercase tracking-widest">
              Loading players…
            </div>
          }>
            <PlayersFilter players={playerList} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
