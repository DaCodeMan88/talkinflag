import { createServerClient } from "@/lib/supabase";
import { RankingsHub } from "@/components/rankings/RankingsHub";
import { buildMetadata } from "@/lib/seo";
import { Suspense } from "react";
import type { Player } from "@/types/player";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "Rankings | Talkin Flag — Player, World & College",
  description:
    "Flag football rankings in one place — top player rankings, IFAF world national team rankings, and college team rankings.",
  path: "/rankings",
});

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home",     item: "https://talkinflag.com" },
    { "@type": "ListItem", position: 2, name: "Rankings", item: "https://talkinflag.com/rankings" },
  ],
};

export default async function RankingsPage() {
  const supabase = createServerClient();

  const { data: players } = (await supabase
    .from("players")
    .select("*")
    .eq("is_verified", true)
    .order("ranking_national", { ascending: true, nullsFirst: false })
    .limit(200)) as { data: Player[] | null };

  const playerList = players ?? [];

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-10">
          <h1 className="font-display text-5xl md:text-7xl uppercase text-brand-white">Rankings</h1>
          <p className="mt-3 text-brand-white/60">
            Player rankings, IFAF world national team standings, and college team rankings.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="text-brand-white/40 text-sm py-8 text-center font-display uppercase tracking-widest">
              Loading rankings…
            </div>
          }
        >
          <RankingsHub players={playerList} />
        </Suspense>
      </div>
    </div>
  );
}
