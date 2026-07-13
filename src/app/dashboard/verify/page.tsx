import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/eval/admin-client";
import { buildMetadata } from "@/lib/seo";
import StatVerifyForm from "./StatVerifyForm";

export const metadata = buildMetadata({
  title: "Verify Stats | Talkin Flag",
  description: "Submit your flag football stats for verification on Talkin Flag.",
  path: "/dashboard/verify",
});

function formatStatLabel(key: string): string {
  const map: Record<string, string> = {
    height_in: "Height",
    weight_lbs: "Weight",
    wingspan_in: "Wingspan",
    forty_yard: "40-Yard Dash",
    vertical_jump: "Vertical Jump",
    passing_yards: "Passing Yards",
    td_passes: "TD Passes",
    receiving_yards: "Receiving Yards",
    receiving_tds: "Receiving TDs",
    interceptions: "Interceptions",
    total_tds: "Total TDs",
    years_active: "Years Active",
  };
  return map[key] ?? key.replace(/_/g, " ");
}

function formatStatValue(key: string, value: unknown): string {
  if (value == null) return "—";
  if (key === "height_in") {
    const n = Number(value);
    return `${Math.floor(n / 12)}'${n % 12}"`;
  }
  if (key === "weight_lbs") return `${value} lbs`;
  if (key === "wingspan_in") return `${value}"`;
  if (key === "forty_yard") return `${value}s`;
  if (key === "vertical_jump") return `${value}"`;
  return String(value);
}

export default async function VerifyStatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/dashboard/verify");

  const db = createAdminClient();
  const { data: player } = await db
    .from("players")
    .select("id, first_name, last_name, position, height_in, weight_lbs, stats")
    .eq("claimed_by", user.id)
    .eq("is_claimed", true)
    .eq("claim_pending", false) // pending claims can't submit stats until approved
    .single();

  if (!player) redirect("/dashboard");

  const stats = (player.stats ?? {}) as Record<string, unknown>;

  // All verifiable stats with their current values
  const ALL_KEYS = [
    "height_in", "weight_lbs", "wingspan_in",
    "forty_yard", "vertical_jump",
    "passing_yards", "td_passes",
    "receiving_yards", "receiving_tds", "interceptions",
    "total_tds", "years_active",
  ];

  const statValues: Record<string, string | null> = {};
  for (const key of ALL_KEYS) {
    if (key === "height_in") statValues[key] = player.height_in ? String(player.height_in) : null;
    else if (key === "weight_lbs") statValues[key] = player.weight_lbs ? String(player.weight_lbs) : null;
    else statValues[key] = stats[key] != null ? String(stats[key]) : null;
  }

  // Existing verification submissions
  const { data: submissions } = await db
    .from("stat_verifications")
    .select("stat_key, status, source_type, created_at")
    .eq("player_id", player.id)
    .order("created_at", { ascending: false });

  const submissionMap: Record<string, { status: string; source_type: string }> = {};
  for (const s of submissions ?? []) {
    if (!submissionMap[s.stat_key]) {
      submissionMap[s.stat_key] = { status: s.status, source_type: s.source_type };
    }
  }

  // Verified coaches for coach sign-off option
  const { data: coaches } = await supabase
    .from("coaches")
    .select("id, first_name, last_name, team, level")
    .eq("is_verified", true)
    .order("last_name");

  const availableStats = ALL_KEYS
    .filter((key) => statValues[key] != null)
    .map((key) => ({
      key,
      label: formatStatLabel(key),
      value: formatStatValue(key, statValues[key]),
      submission: submissionMap[key] ?? null,
    }));

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div className="border-l-4 border-brand-yellow pl-6">
            <h1 className="font-display text-4xl uppercase text-brand-white leading-none">
              Verify Stats
            </h1>
            <p className="text-brand-white/40 mt-2 text-sm">
              {player.first_name} {player.last_name} · {player.position}
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-brand-white/30 text-xs font-display uppercase tracking-widest hover:text-brand-yellow transition-colors"
          >
            ← Dashboard
          </Link>
        </div>

        {/* How it works */}
        <div className="bg-brand-yellow/5 border border-brand-yellow/15 p-5 mb-8 text-brand-white/50 text-xs leading-relaxed">
          <p className="text-brand-white/70 font-display uppercase tracking-widest text-[11px] mb-2">How it works</p>
          Submit a stat with a link to your MaxPreps profile, Hudl film, NFHS/IFAF page, or request a sign-off from a verified coach.
          Once approved, the stat shows a <span className="text-brand-yellow">✓ Verified</span> badge on your public profile.
        </div>

        {availableStats.length === 0 ? (
          <div className="bg-[#0d0d0d] border border-brand-white/10 p-8 text-center space-y-4">
            <p className="text-brand-white/50 text-sm">Add stats to your profile first before submitting for verification.</p>
            <Link
              href="/dashboard/edit"
              className="inline-block bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-xs py-2 px-5 hover:bg-brand-yellow/90 transition-colors"
            >
              Edit Profile →
            </Link>
          </div>
        ) : (
          <StatVerifyForm
            playerId={player.id}
            stats={availableStats}
            coaches={(coaches ?? []).map((c) => ({
              id: c.id,
              name: `${c.first_name} ${c.last_name}`,
              team: c.team,
              level: c.level,
            }))}
          />
        )}
      </div>
    </div>
  );
}
