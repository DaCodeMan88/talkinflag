import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/lib/seo";
import SignOutButton from "./SignOutButton";

export const metadata = buildMetadata({
  title: "Dashboard | Talkin Flag",
  description: "Manage your Talkin Flag player profile.",
  path: "/dashboard",
});

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ claimed?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/dashboard");

  const { claimed } = await searchParams;

  // Get claimed player profile if any
  const { data: player } = await supabase
    .from("players")
    .select("id, first_name, last_name, position, team, level, photo_url")
    .eq("claimed_by", user.id)
    .eq("is_claimed", true)
    .single();

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
          <div className="bg-[#0d0d0d] border border-brand-white/10 p-6 space-y-4">
            <h2 className="font-display text-xl uppercase text-brand-white">
              Your Profile
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-brand-yellow/10 border border-brand-yellow/20 flex items-center justify-center text-brand-yellow font-display text-xl">
                {player.first_name[0]}
              </div>
              <div>
                <p className="text-brand-white font-semibold">
                  {player.first_name} {player.last_name}
                </p>
                <p className="text-brand-white/40 text-sm">
                  {player.position} · {player.team}
                </p>
              </div>
            </div>
            <Link
              href={`/players/${player.id}`}
              className="inline-block text-brand-yellow text-xs font-display uppercase tracking-widest hover:text-brand-yellow/80 transition-colors"
            >
              View Public Profile →
            </Link>
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
