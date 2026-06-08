import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { similarityScore } from "@/lib/knn/similar";

const LEAGUE_LABELS: Record<string, string> = {
  usa_national: "USA National",
  intl_national: "Int'l National",
  us_college: "US College",
  us_hs: "US High School",
  other: "Other",
};

/**
 * "Statistical DNA" — K-Nearest-Neighbors similar players via pgvector,
 * normalized by league difficulty so cross-league gems surface.
 */
export default async function SimilarPlayers({ playerId }: { playerId: string }) {
  const supabase = createServerClient();
  const { data: neighbors, error } = await supabase.rpc("similar_players", { target: playerId, k: 6 });
  if (error || !neighbors || neighbors.length === 0) return null;

  const ids = (neighbors as { id: string; distance: number }[]).map((n) => n.id);
  const distById = new Map((neighbors as { id: string; distance: number }[]).map((n) => [n.id, n.distance]));

  const { data: players } = await supabase
    .from("players")
    .select("id, first_name, last_name, position, level, country_code, league_key, photo_url, is_verified, ranking_national")
    .in("id", ids);
  if (!players || players.length === 0) return null;

  const ordered = [...players].sort(
    (a, b) => (distById.get(a.id) ?? 0) - (distById.get(b.id) ?? 0)
  );

  return (
    <section className="mt-12">
      <h2 className="font-display uppercase tracking-widest text-brand-yellow text-lg">Statistical DNA</h2>
      <p className="text-brand-white/50 text-xs mt-1 max-w-xl">
        Players with the closest profile by position, league-adjusted level, and available stats — our KNN model surfaces
        comparable talent across leagues. Sharpens as profiles are verified.
      </p>
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ordered.map((p) => {
          const sim = similarityScore(distById.get(p.id) ?? 0);
          return (
            <Link
              key={p.id}
              href={`/players/${p.id}`}
              className="rounded-xl border border-white/10 bg-brand-gray p-3 hover:border-brand-yellow/60 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-brand-yellow">{sim.toFixed(0)}% match</span>
                {p.is_verified && <span title="Verified" className="text-brand-yellow text-[9px]">✓</span>}
              </div>
              <p className="mt-1 font-display uppercase tracking-wide text-sm text-brand-white leading-tight">
                {p.first_name} {p.last_name}
              </p>
              <p className="text-[11px] text-brand-white/50">
                {p.position ?? "—"} · {LEAGUE_LABELS[p.league_key as string] ?? p.level ?? ""}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
