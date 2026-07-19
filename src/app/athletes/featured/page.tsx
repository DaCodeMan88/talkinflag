import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/eval/admin-client";
import { buildMetadata } from "@/lib/seo";
import { cohortRankLabel } from "@/lib/rankings/cohort";

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: "Athlete Profile of the Week | Talkin Flag",
  description:
    "Every athlete featured by Talkin Flag as Player of the Week — the top flag football players recognized by Ambra & Tika Marcucci.",
  path: "/athletes/featured",
});

type FeaturedRow = {
  id: string;
  player_id: string;
  featured_from: string;
  featured_until: string;
  message: string | null;
  players: {
    id: string;
    first_name: string;
    last_name: string;
    position: string | null;
    level: string | null;
    school_or_team: string | null;
    country: string | null;
    photo_url: string | null;
    ranking_national: number | null;
  } | null;
};

export default async function FeaturedAthletesHistoryPage() {
  const db = createAdminClient();
  const now = new Date().toISOString();

  const { data: raw } = await db
    .from("featured_athlete")
    .select(
      "id, player_id, featured_from, featured_until, message, players(id, first_name, last_name, position, level, school_or_team, country, photo_url, ranking_national)"
    )
    .order("featured_from", { ascending: false });

  const rows = (raw ?? []) as unknown as FeaturedRow[];

  const current = rows.find((r) => r.featured_until >= now);
  const past = rows.filter((r) => r.featured_until < now);

  function formatWeek(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="bg-brand-black min-h-screen">
      {/* Header */}
      <div className="bg-[#FDDD58] px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <p className="font-display text-xs uppercase tracking-[0.3em] text-black/50 mb-3">
            Talkin Flag
          </p>
          <h1 className="font-display text-5xl md:text-7xl uppercase text-black leading-none">
            Athlete of<br className="hidden sm:block" /> the Week
          </h1>
          <p className="text-black/60 mt-4 text-base max-w-xl">
            Every week, Ambra &amp; Tika recognize one flag football athlete making
            an impact on the game. This is the full archive.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16 space-y-16">
        {/* Current */}
        {current && current.players && (
          <section>
            <h2 className="font-display text-xs uppercase tracking-[0.25em] text-[#FDDD58] mb-6">
              Currently Featured
            </h2>
            <FeaturedCard row={current} isCurrent formatWeek={formatWeek} />
          </section>
        )}

        {/* Past */}
        {past.length > 0 ? (
          <section>
            <h2 className="font-display text-xs uppercase tracking-[0.25em] text-white/30 mb-6">
              Past Athletes — {past.length} total
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {past.map((row) => (
                <FeaturedCard key={row.id} row={row} isCurrent={false} formatWeek={formatWeek} />
              ))}
            </div>
          </section>
        ) : (
          !current && (
            <p className="text-white/30 text-sm">No featured athletes yet.</p>
          )
        )}
      </div>
    </div>
  );
}

function FeaturedCard({
  row,
  isCurrent,
  formatWeek,
}: {
  row: FeaturedRow;
  isCurrent: boolean;
  formatWeek: (d: string) => string;
}) {
  const player = row.players;
  if (!player) return null;

  return (
    <Link
      href={`/players/${player.id}`}
      className={`block group bg-[#0d0d0d] border transition-colors hover:border-[#FDDD58]/40 ${
        isCurrent ? "border-[#FDDD58]/50 sm:col-span-2 lg:col-span-3" : "border-white/10"
      }`}
    >
      {isCurrent ? (
        /* Large layout for current */
        <div className="flex flex-col sm:flex-row items-start gap-0">
          {/* Photo */}
          <div className="relative w-full sm:w-56 h-48 sm:h-64 shrink-0 overflow-hidden">
            {player.photo_url ? (
              <Image
                src={player.photo_url}
                alt={`${player.first_name} ${player.last_name}`}
                fill
                className="object-cover object-top"
                sizes="(max-width: 640px) 100vw, 224px"
              />
            ) : (
              <div className="w-full h-full bg-white/5 flex items-center justify-center">
                <span className="font-display text-4xl text-white/20">
                  {player.first_name[0]}{player.last_name[0]}
                </span>
              </div>
            )}
          </div>
          {/* Info */}
          <div className="p-6 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-[#FDDD58] text-black font-display text-xs uppercase tracking-widest px-2.5 py-1">
                  This Week
                </span>
                {cohortRankLabel(player.level, player.ranking_national) && (
                  <span className="text-white/40 text-xs font-display uppercase tracking-widest">
                    {cohortRankLabel(player.level, player.ranking_national)}
                  </span>
                )}
              </div>
              <p className="font-display text-3xl uppercase text-white group-hover:text-[#FDDD58] transition-colors leading-tight">
                {player.first_name} {player.last_name}
              </p>
              <p className="text-white/40 text-sm mt-1">
                {[player.position, player.level, player.school_or_team, player.country]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {row.message && (
                <p className="text-white/50 italic text-sm mt-3 leading-relaxed">
                  "{row.message}"
                </p>
              )}
            </div>
            <p className="text-white/20 text-xs mt-4">
              Week of {formatWeek(row.featured_from)}
            </p>
          </div>
        </div>
      ) : (
        /* Compact card for past */
        <div className="flex items-center gap-4 p-4">
          <div className="relative w-14 h-14 shrink-0 overflow-hidden rounded-full">
            {player.photo_url ? (
              <Image
                src={player.photo_url}
                alt={`${player.first_name} ${player.last_name}`}
                fill
                className="object-cover object-top"
                sizes="56px"
              />
            ) : (
              <div className="w-full h-full bg-white/10 flex items-center justify-center rounded-full">
                <span className="font-display text-sm text-white/30">
                  {player.first_name[0]}{player.last_name[0]}
                </span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-display text-sm uppercase text-white group-hover:text-[#FDDD58] transition-colors truncate">
              {player.first_name} {player.last_name}
            </p>
            <p className="text-white/30 text-xs truncate">
              {[player.position, player.school_or_team].filter(Boolean).join(" · ")}
            </p>
            <p className="text-white/20 text-xs mt-0.5">{formatWeek(row.featured_from)}</p>
          </div>
          {cohortRankLabel(player.level, player.ranking_national) && (
            <span className="ml-auto shrink-0 text-white/20 font-display text-xs uppercase tracking-widest">
              {cohortRankLabel(player.level, player.ranking_national)}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
