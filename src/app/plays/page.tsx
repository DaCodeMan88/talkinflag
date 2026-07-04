import Link from "next/link";
import { createAdminClient } from "@/lib/eval/admin-client";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: "Top 10 Plays of the Week | Talkin Flag",
  description:
    "Every week Talkin Flag curates the top 10 flag football plays. Browse the full archive.",
  path: "/plays",
});

type WeekRow = {
  week_featured: string;
  count: number;
  sample_video: string | null;
};

function youtubeThumb(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    let vid: string | null = null;
    if (u.hostname.includes("youtube.com")) vid = u.searchParams.get("v");
    if (u.hostname === "youtu.be") vid = u.pathname.slice(1);
    if (vid) return `https://img.youtube.com/vi/${vid}/mqdefault.jpg`;
  } catch { /* ignore */ }
  return null;
}

function formatWeekLabel(week: string): string {
  const match = week.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return week;
  const year = parseInt(match[1]);
  const weekNum = parseInt(match[2]);
  const jan4 = new Date(year, 0, 4);
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  const start = new Date(startOfWeek1);
  start.setDate(startOfWeek1.getDate() + (weekNum - 1) * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `Week of ${fmt(start)} – ${fmt(end)}, ${year}`;
}

export default async function PlaysArchivePage() {
  const db = createAdminClient();

  // Get distinct weeks with count and a sample video URL
  const { data: raw } = await db
    .from("highlight_submissions")
    .select("week_featured, video_url")
    .eq("status", "top10")
    .not("week_featured", "is", null)
    .order("week_featured", { ascending: false });

  if (!raw || raw.length === 0) {
    return (
      <div className="bg-brand-black min-h-screen">
        <div className="bg-[#FDDD58] px-6 py-14">
          <div className="max-w-5xl mx-auto">
            <h1 className="font-display text-5xl md:text-7xl uppercase text-black leading-none">
              Top 10 Plays
            </h1>
            <p className="text-black/60 mt-3">No highlights published yet.</p>
          </div>
        </div>
      </div>
    );
  }

  // Group by week
  const weekMap = new Map<string, WeekRow>();
  for (const row of raw) {
    const w = row.week_featured as string;
    if (!weekMap.has(w)) {
      weekMap.set(w, { week_featured: w, count: 0, sample_video: row.video_url });
    }
    weekMap.get(w)!.count++;
  }
  const weeks = Array.from(weekMap.values());

  return (
    <div className="bg-brand-black min-h-screen">
      {/* Header */}
      <div className="bg-[#FDDD58] px-6 py-14">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-display text-5xl md:text-7xl uppercase text-black leading-none">
            Top 10 Plays
          </h1>
          <p className="text-black/60 mt-3 text-base">
            {weeks.length} week{weeks.length !== 1 ? "s" : ""} of the best flag football highlights, curated by Talkin Flag.
          </p>
        </div>
      </div>

      {/* Archive grid */}
      <div className="max-w-5xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {weeks.map((w, idx) => {
            const thumb = youtubeThumb(w.sample_video);
            const isLatest = idx === 0;
            return (
              <Link
                key={w.week_featured}
                href={`/plays/week/${w.week_featured}`}
                className="group relative bg-[#0d0d0d] border border-white/10 hover:border-[#FDDD58]/40 transition-colors overflow-hidden"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-black overflow-hidden">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt=""
                      className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                      <span className="font-display text-white/10 text-4xl uppercase tracking-widest">
                        TF
                      </span>
                    </div>
                  )}
                  {isLatest && (
                    <div className="absolute top-3 left-3 bg-[#FDDD58] text-black font-display text-xs uppercase tracking-widest px-3 py-1">
                      Latest
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <p className="font-display text-base uppercase text-white group-hover:text-[#FDDD58] transition-colors leading-tight">
                    {formatWeekLabel(w.week_featured)}
                  </p>
                  <p className="text-white/30 text-xs mt-1 font-display uppercase tracking-widest">
                    Top {w.count} Plays · {w.week_featured}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
