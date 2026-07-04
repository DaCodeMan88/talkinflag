import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/eval/admin-client";

type FeaturedAthlete = {
  id: string;
  player_id: string;
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
    stats: Record<string, unknown> | null;
  } | null;
};

export async function FeaturedAthleteSection() {
  const db = createAdminClient();
  const now = new Date().toISOString();

  const { data: raw } = await db
    .from("featured_athlete")
    .select(
      "id, player_id, featured_until, message, players(id, first_name, last_name, position, level, school_or_team, country, photo_url, ranking_national, stats)"
    )
    .gte("featured_until", now)
    .order("featured_from", { ascending: false })
    .limit(1)
    .single();

  if (!raw) return null;

  const featured = raw as unknown as FeaturedAthlete;
  const player = featured.players;
  if (!player) return null;

  const stats = player.stats as Record<string, string | number> | null;
  const keyStats: { label: string; value: string }[] = [];
  if (stats?.forty_yard) keyStats.push({ label: "40-Yard", value: `${stats.forty_yard}s` });
  if (stats?.vertical_in) keyStats.push({ label: "Vertical", value: `${stats.vertical_in}"` });
  if (stats?.height_in || player.stats) {
    // height from player directly
  }

  return (
    <section className="bg-[#FDDD58] py-16 px-6" aria-label="Athlete Profile of the Week">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-display text-xs uppercase tracking-[0.3em] text-black/50">
            Talkin Flag Presents
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Left: info */}
          <div>
            <h2 className="font-display text-5xl md:text-7xl uppercase text-black leading-none mb-2">
              Athlete of<br />the Week
            </h2>

            <div className="mt-6 space-y-1">
              <p className="font-display text-3xl md:text-4xl uppercase text-black">
                {player.first_name} {player.last_name}
              </p>
              <p className="text-black/60 font-body text-base">
                {[player.position, player.level, player.school_or_team, player.country]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>

            {player.ranking_national && (
              <div className="mt-4 inline-flex items-center gap-2 bg-black text-[#FDDD58] px-4 py-2">
                <span className="font-display text-xs uppercase tracking-widest">Ranked</span>
                <span className="font-display text-2xl">#{player.ranking_national}</span>
                <span className="font-display text-xs uppercase tracking-widest text-[#FDDD58]/60">National</span>
              </div>
            )}

            {keyStats.length > 0 && (
              <div className="mt-6 flex gap-6">
                {keyStats.map((s) => (
                  <div key={s.label}>
                    <p className="font-display text-2xl text-black">{s.value}</p>
                    <p className="text-black/50 text-xs uppercase tracking-widest">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {featured.message && (
              <blockquote className="mt-6 border-l-4 border-black/20 pl-4 text-black/70 italic font-body text-sm leading-relaxed">
                {featured.message}
              </blockquote>
            )}

            <div className="mt-8 flex items-center gap-4">
              <Link
                href={`/players/${player.id}`}
                className="bg-black text-[#FDDD58] font-display uppercase tracking-widest px-6 py-3 text-sm hover:bg-black/80 transition-colors"
              >
                View Full Profile →
              </Link>
              <Link
                href="/athletes/featured"
                className="text-black/50 font-display uppercase tracking-widest text-xs hover:text-black transition-colors"
              >
                Past Athletes
              </Link>
            </div>
          </div>

          {/* Right: photo */}
          <div className="relative flex justify-center lg:justify-end">
            {player.photo_url ? (
              <div className="relative w-72 h-80 md:w-80 md:h-96">
                <Image
                  src={player.photo_url}
                  alt={`${player.first_name} ${player.last_name}`}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 288px, 320px"
                />
                {/* Talkin Flag watermark */}
                <div className="absolute bottom-3 right-3 bg-black/80 px-2.5 py-1">
                  <span className="font-display text-[#FDDD58] text-xs uppercase tracking-widest">
                    Talkin Flag
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-72 h-80 bg-black/10 flex items-center justify-center">
                <span className="font-display text-6xl text-black/20">
                  {player.first_name[0]}{player.last_name[0]}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
