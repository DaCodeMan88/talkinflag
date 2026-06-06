import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Play = {
  id: string;
  video_url: string;
  description: string | null;
  play_type: string | null;
  rank_in_week: number;
  week_featured: string;
  players: {
    id: string;
    first_name: string;
    last_name: string;
    position: string | null;
  } | null;
};

function youtubeThumb(url: string): string | null {
  try {
    const u = new URL(url);
    let vid: string | null = null;
    if (u.hostname.includes("youtube.com")) vid = u.searchParams.get("v");
    if (u.hostname === "youtu.be") vid = u.pathname.slice(1);
    if (vid) return `https://img.youtube.com/vi/${vid}/mqdefault.jpg`;
  } catch { /* ignore */ }
  return null;
}

export async function Top10PlaysTeaser() {
  const supabase = await createClient();

  // Find the most recently published week
  const { data: weekRow } = await supabase
    .from("highlight_submissions")
    .select("week_featured")
    .eq("status", "top10")
    .order("week_featured", { ascending: false })
    .limit(1)
    .single();

  if (!weekRow?.week_featured) return null;

  const currentWeek = weekRow.week_featured;

  const { data: raw } = await supabase
    .from("highlight_submissions")
    .select(
      "id, video_url, description, play_type, rank_in_week, week_featured, players(id, first_name, last_name, position)"
    )
    .eq("status", "top10")
    .eq("week_featured", currentWeek)
    .order("rank_in_week", { ascending: true })
    .limit(5);

  if (!raw || raw.length === 0) return null;

  const plays = raw as unknown as Play[];

  return (
    <section className="bg-[#060606] border-t border-brand-white/5 py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="font-display text-xs uppercase tracking-[0.3em] text-[#FDDD58] mb-2">
              This Week
            </p>
            <h2 className="font-display text-4xl md:text-6xl uppercase text-white leading-none">
              Top 10 Plays
            </h2>
          </div>
          <Link
            href={`/plays/week/${currentWeek}`}
            className="text-[#FDDD58] font-display uppercase tracking-widest text-sm hover:underline hidden md:block"
          >
            See All 10 →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {plays.map((play) => {
            const thumb = youtubeThumb(play.video_url);
            return (
              <Link
                key={play.id}
                href={`/plays/week/${play.week_featured}`}
                className="group relative bg-[#0d0d0d] border border-white/10 hover:border-[#FDDD58]/40 transition-colors overflow-hidden"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-black overflow-hidden">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt=""
                      className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                      <span className="text-white/20 text-2xl">▶</span>
                    </div>
                  )}
                  {/* Rank badge */}
                  <div className="absolute top-2 left-2 bg-[#FDDD58] text-black font-display text-xs px-2 py-0.5 leading-none">
                    #{play.rank_in_week}
                  </div>
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 bg-[#FDDD58] rounded-full flex items-center justify-center">
                      <span className="text-black text-sm ml-0.5">▶</span>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="font-display text-sm uppercase text-white group-hover:text-[#FDDD58] transition-colors truncate">
                    {play.players
                      ? `${play.players.first_name} ${play.players.last_name}`
                      : "Anonymous"}
                  </p>
                  <p className="text-white/30 text-xs truncate mt-0.5">
                    {[play.players?.position, play.play_type].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 text-center md:hidden">
          <Link
            href={`/plays/week/${currentWeek}`}
            className="text-[#FDDD58] font-display uppercase tracking-widest text-sm hover:underline"
          >
            See All 10 →
          </Link>
        </div>
      </div>
    </section>
  );
}
