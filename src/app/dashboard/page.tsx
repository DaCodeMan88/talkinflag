import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/lib/seo";
import SignOutButton from "./SignOutButton";

export const metadata = buildMetadata({
  title: "Dashboard | Talkin Flag",
  description: "Manage your Talkin Flag player profile.",
  path: "/dashboard",
});

function completionScore(player: Record<string, unknown>, stats: Record<string, unknown>): number {
  const fields = [
    player.photo_url,
    player.bio,
    player.instagram,
    player.highlight_url,
    player.height_in,
    player.weight_lbs,
    stats.forty_yard,
    stats.occupation,
  ];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

function missingFields(player: Record<string, unknown>, stats: Record<string, unknown>): string[] {
  const missing: string[] = [];
  if (!player.photo_url) missing.push("Add photo");
  if (!player.bio) missing.push("Write bio");
  if (!player.instagram) missing.push("Add Instagram");
  if (!player.height_in) missing.push("Add height");
  if (!stats.forty_yard) missing.push("Add 40-yard");
  return missing.slice(0, 3);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ claimed?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/dashboard");

  const { claimed } = await searchParams;

  const { data: player } = await supabase
    .from("players")
    .select("id, first_name, last_name, position, team, level, photo_url, bio, instagram, highlight_url, height_in, weight_lbs, stats, school_or_team")
    .eq("claimed_by", user.id)
    .eq("is_claimed", true)
    .single();

  const stats = (player?.stats ?? {}) as Record<string, unknown>;
  const pct = player ? completionScore(player as Record<string, unknown>, stats) : 0;
  const missing = player ? missingFields(player as Record<string, unknown>, stats) : [];

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20 px-4">
      <div className="max-w-2xl mx-auto">

        <div className="flex items-start justify-between mb-10">
          <div className="border-l-4 border-brand-yellow pl-6">
            <h1 className="font-display text-4xl uppercase text-brand-white leading-none">
              Dashboard
            </h1>
            <p className="text-brand-white/40 mt-2 text-sm">{user.email}</p>
          </div>
          <SignOutButton />
        </div>

        {claimed && (
          <div className="bg-brand-yellow/10 border border-brand-yellow/30 p-4 mb-8 text-brand-yellow text-sm font-display uppercase tracking-widest">
            Profile claimed successfully!
          </div>
        )}

        {player ? (
          <div className="space-y-4">
            {/* Profile card */}
            <div className="bg-[#0d0d0d] border border-brand-white/10 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl uppercase text-brand-white">Your Profile</h2>
                <span className="border border-brand-yellow/40 text-brand-yellow text-xs px-3 py-1 font-display uppercase tracking-widest">
                  ✓ Claimed
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 flex-shrink-0">
                  {player.photo_url ? (
                    <Image
                      src={player.photo_url}
                      alt={`${player.first_name} ${player.last_name}`}
                      fill
                      className="rounded-full object-cover border-2 border-brand-yellow/30"
                      unoptimized
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-brand-yellow/10 border-2 border-brand-yellow/20 flex items-center justify-center">
                      <span className="font-display text-xl text-brand-yellow">
                        {player.first_name[0]}{player.last_name[0]}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-brand-white font-semibold text-lg">
                    {player.first_name} {player.last_name}
                  </p>
                  <p className="text-brand-white/40 text-sm">
                    {player.position} · {player.school_or_team ?? player.team}
                  </p>
                </div>
              </div>

              {/* Completion bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-display uppercase tracking-widest text-brand-white/30">
                    Profile Complete
                  </span>
                  <span className="text-xs font-display text-brand-yellow">{pct}%</span>
                </div>
                <div className="h-1 bg-brand-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-yellow transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {missing.length > 0 && (
                  <p className="text-brand-white/25 text-xs mt-2">
                    {missing.join(" · ")}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 pt-1">
                <Link
                  href="/dashboard/edit"
                  className="bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-xs py-2 px-5 hover:bg-brand-yellow/90 transition-colors"
                >
                  Edit Profile
                </Link>
                <Link
                  href={`/players/${player.id}`}
                  className="text-brand-white/40 text-xs font-display uppercase tracking-widest hover:text-brand-yellow transition-colors"
                >
                  View Public Profile →
                </Link>
              </div>
            </div>

            {/* Verification */}
            <div className="bg-[#0d0d0d] border border-brand-white/10 p-5 flex items-center justify-between">
              <div>
                <p className="text-brand-white/60 text-sm font-display uppercase tracking-widest">
                  Stat Verification
                </p>
                <p className="text-brand-white/25 text-xs mt-1">
                  Earn the ✓ Verified badge on your measurables
                </p>
              </div>
              <Link
                href="/dashboard/verify"
                className="text-brand-yellow text-xs font-display uppercase tracking-widest hover:text-brand-yellow/80 transition-colors"
              >
                Submit →
              </Link>
            </div>

            {/* Coach application */}
            <div className="bg-[#0d0d0d] border border-brand-white/10 p-5 flex items-center justify-between">
              <div>
                <p className="text-brand-white/60 text-sm font-display uppercase tracking-widest">
                  Are you a coach?
                </p>
                <p className="text-brand-white/25 text-xs mt-1">
                  Apply for verified coach status
                </p>
              </div>
              <Link
                href="/coaches/apply"
                className="text-brand-yellow text-xs font-display uppercase tracking-widest hover:text-brand-yellow/80 transition-colors"
              >
                Apply →
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-[#0d0d0d] border border-brand-white/10 p-8 text-center space-y-4">
            <div className="text-4xl">🏈</div>
            <p className="text-brand-white/60 text-sm">
              No player profile linked to your account yet.
            </p>
            <Link
              href="/players"
              className="inline-block bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-xs py-2 px-5 hover:bg-brand-yellow/90 transition-colors"
            >
              Find Your Profile
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
