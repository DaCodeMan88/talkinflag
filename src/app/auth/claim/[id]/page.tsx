import Link from "next/link";
import { redirect } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";
import ClaimButton from "./ClaimButton";

export const metadata = buildMetadata({
  title: "Claim Your Profile | Talkin Flag",
  description: "Sign up and claim your flag football player profile on Talkin Flag.",
  path: "/auth/claim",
});

export default async function ClaimProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not signed in — redirect to login with claim intent
  if (!user) {
    redirect(`/auth/login?claim=${id}`);
  }

  // Fetch the player
  const { data: player } = await supabase
    .from("players")
    .select("id, first_name, last_name, is_claimed, claimed_by")
    .eq("id", id)
    .single();

  if (!player) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center px-4 pt-24 pb-20">
        <div className="max-w-md w-full text-center">
          <p className="text-brand-white/50">Player profile not found.</p>
          <Link href="/players" className="mt-4 inline-block text-brand-yellow text-sm font-display uppercase tracking-widest">
            Browse Players
          </Link>
        </div>
      </div>
    );
  }

  // Already claimed by this user
  if (player.is_claimed && player.claimed_by === user.id) {
    redirect(`/dashboard`);
  }

  // Already claimed by someone else
  if (player.is_claimed && player.claimed_by !== user.id) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center px-4 pt-24 pb-20">
        <div className="max-w-md w-full">
          <div className="bg-[#0d0d0d] border border-brand-white/10 p-8 text-center space-y-4">
            <div className="text-4xl">🔒</div>
            <h1 className="font-display text-2xl uppercase text-brand-white">Already Claimed</h1>
            <p className="text-brand-white/50 text-sm">
              This profile has already been claimed. If you believe this is an error, contact us.
            </p>
            <Link
              href={`/players/${id}`}
              className="inline-block mt-2 text-brand-yellow text-xs font-display uppercase tracking-widest hover:text-brand-yellow/80 transition-colors"
            >
              ← Back to Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center px-4 pt-24 pb-20">
      <div className="max-w-md w-full">
        <div className="border-l-4 border-brand-yellow pl-6 mb-10">
          <h1 className="font-display text-4xl uppercase text-brand-white leading-none">
            Claim Your Profile
          </h1>
          <p className="text-brand-white/50 mt-3 text-sm leading-relaxed">
            Confirm you are{" "}
            <span className="text-brand-white font-semibold">
              {player.first_name} {player.last_name}
            </span>{" "}
            and claim this profile.
          </p>
        </div>

        <div className="bg-[#0d0d0d] border border-brand-white/10 p-8 space-y-6">
          <div className="bg-brand-yellow/5 border border-brand-yellow/20 p-4 text-sm text-brand-white/70 leading-relaxed">
            <p>Signed in as <span className="text-brand-white">{user.email}</span></p>
            <p className="mt-1 text-brand-white/40 text-xs">
              Claiming this profile links it permanently to your account.
            </p>
          </div>

          <ClaimButton playerId={id} playerName={`${player.first_name} ${player.last_name}`} />
        </div>

        <div className="mt-6 text-center">
          <Link
            href={`/players/${id}`}
            className="text-brand-white/40 text-xs font-display uppercase tracking-widest hover:text-brand-yellow transition-colors"
          >
            ← Back to Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
