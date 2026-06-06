import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

type Props = { params: Promise<{ week: string }> };

export async function generateMetadata({ params }: Props) {
  const { week } = await params;
  return buildMetadata({
    title: `Top 10 Plays · ${week} | Talkin Flag`,
    description: `The top 10 flag football plays of the week curated by Talkin Flag — ${week}.`,
    path: `/plays/week/${week}`,
  });
}

type Play = {
  id: string;
  video_url: string;
  description: string | null;
  play_type: string | null;
  rank_in_week: number;
  players: {
    id: string;
    first_name: string;
    last_name: string;
    position: string | null;
    school_or_team: string | null;
  } | null;
};

function youtubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}?rel=0`;
    }
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${u.pathname}?rel=0`;
    }
  } catch { /* ignore */ }
  return null;
}

function formatWeekLabel(week: string): string {
  // "2026-W23" → approximate date range
  const match = week.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return week;
  const year = parseInt(match[1]);
  const weekNum = parseInt(match[2]);
  // ISO week 1 is the week containing the first Thursday of January
  const jan4 = new Date(year, 0, 4);
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  const start = new Date(startOfWeek1);
  start.setDate(startOfWeek1.getDate() + (weekNum - 1) * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}, ${year}`;
}

export default async function Top10WeekPage({ params }: Props) {
  const { week } = await params;
  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("highlight_submissions")
    .select(
      "id, video_url, description, play_type, rank_in_week, players(id, first_name, last_name, position, school_or_team)"
    )
    .eq("status", "top10")
    .eq("week_featured", week)
    .order("rank_in_week", { ascending: true });

  if (!raw || raw.length === 0) notFound();

  const plays = raw as unknown as Play[];
  const weekLabel = formatWeekLabel(week);

  return (
    <div className="bg-brand-black min-h-screen">
      {/* Header */}
      <div className="bg-[#FDDD58] px-6 py-14">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/plays"
            className="text-black/40 font-display text-xs uppercase tracking-widest hover:text-black/70 transition-colors"
          >
            ← All Weeks
          </Link>
          <h1 className="font-display text-5xl md:text-7xl uppercase text-black leading-none mt-4">
            Top {plays.length} Plays
          </h1>
          <p className="text-black/60 font-body mt-2 text-base">{weekLabel}</p>
        </div>
      </div>

      {/* Plays */}
      <div className="max-w-5xl mx-auto px-6 py-14 space-y-12">
        {plays.map((play) => {
          const embedUrl = youtubeEmbedUrl(play.video_url);
          return (
            <div key={play.id} className="space-y-4">
              {/* Rank + player */}
              <div className="flex items-center gap-5">
                <span className="font-display text-5xl md:text-6xl text-[#FDDD58] leading-none w-16 shrink-0">
                  #{play.rank_in_week}
                </span>
                <div>
                  {play.players ? (
                    <Link
                      href={`/players/${play.players.id}`}
                      className="font-display text-xl md:text-2xl uppercase text-white hover:text-[#FDDD58] transition-colors"
                    >
                      {play.players.first_name} {play.players.last_name}
                    </Link>
                  ) : (
                    <span className="font-display text-xl uppercase text-white">Anonymous</span>
                  )}
                  <p className="text-white/40 text-sm mt-0.5">
                    {[play.players?.position, play.players?.school_or_team, play.play_type]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>

              {/* Video */}
              {embedUrl ? (
                <div className="aspect-video w-full max-w-2xl bg-black">
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    title={`Play #${play.rank_in_week}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <a
                  href={play.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-[#FDDD58]/10 border border-[#FDDD58]/20 text-[#FDDD58] text-sm px-4 py-2 hover:bg-[#FDDD58]/20 transition-colors"
                >
                  Watch Video →
                </a>
              )}

              {/* Description */}
              {play.description && (
                <p className="text-white/50 text-sm max-w-2xl leading-relaxed">
                  {play.description}
                </p>
              )}

              {/* Divider */}
              {play.rank_in_week < plays.length && (
                <div className="border-t border-white/5 pt-2" />
              )}
            </div>
          );
        })}

        {/* Share CTA */}
        <div className="border-t border-white/10 pt-10 text-center">
          <p className="text-white/40 text-sm mb-4 font-display uppercase tracking-widest">
            Share This Week's Top 10
          </p>
          <a
            href={`https://twitter.com/intent/tweet?text=Top%20${plays.length}%20Flag%20Football%20Plays%20of%20the%20Week%20%F0%9F%8F%88%20via%20%40TalkinFlagShow&url=${encodeURIComponent(`https://talkinflag.com/plays/week/${week}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#FDDD58] text-black font-display uppercase tracking-widest px-6 py-3 text-sm hover:bg-[#FDDD58]/80 transition-colors"
          >
            Share on X →
          </a>
        </div>
      </div>
    </div>
  );
}
