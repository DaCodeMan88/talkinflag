import { buildMetadata } from "@/lib/seo";
import { createServerClient } from "@/lib/supabase";
import Link from "next/link";
import { DIMENSION_LABELS, type DimensionKey } from "@/lib/eval/dimensions";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "TF Rankings | Talkin Flag — Community-Weighted Player Rankings",
  description:
    "The Talkin Flag player rankings — powered by Coaches, Experts, and Hosts weighted poll system with verification-confidence scoring.",
  path: "/rankings",
});

const POLL_CONTRIBUTIONS = [
  { role: "Coaches", pct: 55, color: "text-brand-yellow" },
  { role: "Experts", pct: 30, color: "text-blue-400" },
  { role: "Hosts",   pct: 15, color: "text-white/60" },
];

const DIM_ORDER: DimensionKey[] = [
  "competition", "production", "athleticism", "football_iq",
  "ball_skills", "defense", "clutch", "intangibles", "versatility", "consistency",
];

export default async function RankingsPage() {
  const supabase = createServerClient();

  // Fetch ranked players (national rank set) with top-100 limit
  const { data: players } = await supabase
    .from("players")
    .select("id, first_name, last_name, position, level, school_or_team, country, is_verified, is_claimed, ranking_national, ranking_position, stats, gender")
    .eq("is_approved", true)
    .not("ranking_national", "is", null)
    .order("ranking_national", { ascending: true })
    .limit(100);

  // Fetch latest ranking_weights to show what the community currently values
  const { data: rawWeights } = await supabase
    .from("ranking_weights")
    .select("key, value");

  const weights = Object.fromEntries((rawWeights ?? []).map((w) => [w.key, Number(w.value)]));

  // Build blended dimension weights for display
  const coachBlend  = weights["blend.coach"]  ?? 0.55;
  const expertBlend = weights["blend.expert"] ?? 0.30;
  const hostBlend   = weights["blend.host"]   ?? 0.15;
  const total = coachBlend + expertBlend + hostBlend;

  const blendedDisplay = DIM_ORDER.map((dim) => {
    const cw = weights[`dim.coach.${dim}`]  ?? 0;
    const ew = weights[`dim.expert.${dim}`] ?? 0;
    const hw = weights[`dim.host.${dim}`]   ?? 0;
    const blended = (coachBlend * cw + expertBlend * ew + hostBlend * hw) / total;
    return { dim, label: DIMENSION_LABELS[dim], blended: Math.round(blended * 10) / 10 };
  }).sort((a, b) => b.blended - a.blended);

  const hasWeights = blendedDisplay.some((d) => d.blended > 0);
  const ranked = players ?? [];

  return (
    <div className="bg-brand-black min-h-screen pt-28 pb-24 px-6">
      <div className="max-w-4xl mx-auto">

        {/* Hero */}
        <div className="mb-14">
          <p className="text-brand-yellow font-display text-[10px] uppercase tracking-[0.4em] mb-4">
            Community-Powered
          </p>
          <h1 className="font-display text-5xl md:text-7xl uppercase text-brand-white leading-none mb-4">
            TF Rankings
          </h1>
          <p className="text-brand-white/50 text-base max-w-xl leading-relaxed">
            Ranked by the flag football community — not an algorithm no one can see.
            Poll weights from verified Coaches, Experts, and Hosts drive every score.{" "}
            <Link href="/how-rankings-work" className="text-brand-yellow hover:underline">
              How it works →
            </Link>
          </p>
        </div>

        {/* Poll contribution bar */}
        <div className="mb-12 border border-brand-yellow/20 bg-[#0d0d0d] p-6">
          <p className="font-display text-xs uppercase tracking-widest text-brand-yellow mb-5">
            Current Poll Blend
          </p>
          <div className="flex gap-6 mb-4">
            {POLL_CONTRIBUTIONS.map((p) => (
              <div key={p.role} className="flex items-baseline gap-2">
                <span className={`font-display text-2xl ${p.color}`}>{p.pct}%</span>
                <span className="text-brand-white/40 text-xs uppercase tracking-widest">{p.role}</span>
              </div>
            ))}
          </div>
          <p className="text-brand-white/25 text-xs">
            Blend is admin-adjustable. Defaults: Coaches 55 / Experts 30 / Hosts 15.
            Verified Coaches get full weight; unverified players receive a 65% confidence factor.
          </p>
        </div>

        {/* What the community currently values */}
        {hasWeights && (
          <div className="mb-12">
            <h2 className="font-display text-sm uppercase tracking-widest text-brand-yellow mb-5">
              What the Community Values Most
            </h2>
            <div className="space-y-2">
              {blendedDisplay.slice(0, 6).map(({ dim, label, blended }) => {
                const pct = blended > 0 ? Math.min(100, (blended / 10) * 100) : 0;
                return (
                  <div key={dim} className="flex items-center gap-4">
                    <span className="w-44 text-xs text-brand-white/60 shrink-0">{label}</span>
                    <div className="flex-1 h-1.5 bg-brand-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-yellow rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs text-brand-yellow font-display tabular-nums">
                      {blended.toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-brand-white/25 text-xs mt-3">
              Blended dimension weights derived from Evaluation Philosophy poll responses.
              Take the eval at{" "}
              <Link href="/evaluate" className="text-brand-yellow hover:underline">/evaluate</Link> to influence future rankings.
            </p>
          </div>
        )}

        {/* Rankings table */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-sm uppercase tracking-widest text-brand-yellow">
              National Rankings
            </h2>
            <span className="text-brand-white/30 text-xs">{ranked.length} ranked players</span>
          </div>

          {ranked.length === 0 ? (
            <div className="border border-brand-yellow/20 bg-[#111111] p-12 text-center">
              <p className="font-display text-lg uppercase text-brand-yellow mb-2">
                Rankings Coming Soon
              </p>
              <p className="text-brand-white/50 text-sm max-w-sm mx-auto">
                Run the first recompute from the admin panel, or complete the Evaluation quiz to
                contribute poll weight.
              </p>
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                <Link
                  href="/evaluate"
                  className="font-display uppercase tracking-wider text-sm px-5 py-2.5 bg-brand-yellow text-brand-black hover:bg-yellow-400 transition-colors"
                >
                  Take the Eval
                </Link>
                <Link
                  href="/players"
                  className="font-display uppercase tracking-wider text-sm px-5 py-2.5 border border-brand-yellow text-brand-yellow hover:bg-brand-yellow hover:text-brand-black transition-colors"
                >
                  Browse All Players
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="TF national player rankings">
                <thead>
                  <tr className="border-b border-brand-yellow/20">
                    <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-3 w-10">#</th>
                    <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-3">Player</th>
                    <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-3 w-12">Pos</th>
                    <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-3 hidden sm:table-cell">Pos #</th>
                    <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-3 hidden md:table-cell">Level</th>
                    <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 hidden lg:table-cell">Team</th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((player) => (
                    <tr
                      key={player.id}
                      className="border-b border-brand-white/5 hover:bg-brand-white/5 transition-colors group"
                    >
                      <td className="py-3 pr-3 text-brand-yellow font-display tabular-nums">
                        {player.ranking_national}
                      </td>
                      <td className="py-3 pr-3">
                        <Link
                          href={`/players/${player.id}`}
                          className="text-brand-white font-medium group-hover:text-brand-yellow transition-colors"
                        >
                          {player.first_name} {player.last_name}
                          {player.is_verified && (
                            <span className="ml-1.5 text-brand-yellow text-xs" title="Verified profile">✓</span>
                          )}
                        </Link>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="text-brand-yellow font-display text-xs uppercase">{player.position ?? "—"}</span>
                      </td>
                      <td className="py-3 pr-3 text-brand-white/40 text-xs hidden sm:table-cell tabular-nums">
                        #{player.ranking_position}
                      </td>
                      <td className="py-3 pr-3 text-brand-white/40 text-xs hidden md:table-cell capitalize">
                        {player.level?.replace("_", " ") ?? "—"}
                      </td>
                      <td className="py-3 text-brand-white/40 text-xs hidden lg:table-cell">
                        {player.school_or_team ?? player.country ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* CTA strip */}
        <div className="mt-14 flex flex-wrap gap-4 border-t border-brand-white/10 pt-10">
          <Link
            href="/evaluate"
            className="font-display uppercase tracking-wider text-sm px-6 py-3 bg-brand-yellow text-brand-black hover:bg-yellow-400 transition-colors"
          >
            Influence Rankings — Take the Eval
          </Link>
          <Link
            href="/players"
            className="font-display uppercase tracking-wider text-sm px-6 py-3 border border-brand-yellow/40 text-brand-yellow hover:bg-brand-yellow hover:text-brand-black transition-colors"
          >
            Browse All Players
          </Link>
          <Link
            href="/how-rankings-work"
            className="font-display uppercase tracking-wider text-sm px-6 py-3 border border-brand-white/20 text-brand-white/50 hover:border-brand-white/40 hover:text-brand-white transition-colors"
          >
            Methodology
          </Link>
        </div>

      </div>
    </div>
  );
}
