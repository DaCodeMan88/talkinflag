import Link from "next/link";
import { redirect } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/eval/admin-client";
import ClaimCoachButton from "./ClaimCoachButton";

export const metadata = buildMetadata({
  title: "Claim Your Coach Profile | Talkin Flag",
  description: "Sign in and claim your verified flag football coach profile on Talkin Flag.",
  path: "/auth/claim-coach",
});

export default async function ClaimCoachPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not signed in — bounce through login with the coach-claim intent preserved.
  if (!user) {
    redirect(`/auth/login?claimCoach=${id}`);
  }

  const db = createAdminClient();
  const { data: coach } = await db
    .from("coaches")
    .select("id, user_id, first_name, last_name, team, is_verified")
    .eq("id", id)
    .maybeSingle();

  if (!coach) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center px-4 pt-24 pb-20">
        <div className="max-w-md w-full text-center">
          <p className="text-brand-white/50">Coach profile not found.</p>
          <Link href="/coaches" className="mt-4 inline-block text-brand-yellow text-sm font-display uppercase tracking-widest">
            Browse Coaches
          </Link>
        </div>
      </div>
    );
  }

  // Already yours (including a claim that's now pending review).
  if (coach.user_id === user.id) redirect(`/dashboard`);

  // Already claimed by someone else.
  if (coach.user_id && coach.user_id !== user.id) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center px-4 pt-24 pb-20">
        <div className="max-w-md w-full">
          <div className="bg-[#0d0d0d] border border-brand-white/10 p-8 text-center space-y-4">
            <div className="text-4xl">🔒</div>
            <h1 className="font-display text-2xl uppercase text-brand-white">Already Claimed</h1>
            <p className="text-brand-white/50 text-sm">
              This coach profile has already been claimed. If you believe this is an error, contact us.
            </p>
            <Link
              href={`/coaches/${id}`}
              className="inline-block mt-2 text-brand-yellow text-xs font-display uppercase tracking-widest hover:text-brand-yellow/80 transition-colors"
            >
              ← Back to Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Unclaimed but not publicly listed — nothing to claim here.
  if (!coach.is_verified) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center px-4 pt-24 pb-20">
        <div className="max-w-md w-full text-center">
          <p className="text-brand-white/50">This profile isn&apos;t available to claim.</p>
          <Link href="/coaches" className="mt-4 inline-block text-brand-yellow text-sm font-display uppercase tracking-widest">
            Browse Coaches
          </Link>
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
              {coach.first_name} {coach.last_name}
            </span>
            {coach.team ? `, ${coach.team}` : ""} and claim this coach profile.
          </p>
        </div>

        <div className="bg-[#0d0d0d] border border-brand-white/10 p-8 space-y-6">
          <div className="bg-brand-yellow/5 border border-brand-yellow/20 p-4 text-sm text-brand-white/70 leading-relaxed">
            <p>Signed in as <span className="text-brand-white">{user.email}</span></p>
            <p className="mt-1 text-brand-white/40 text-xs">
              Claiming links this profile to your account and sends it to our team for verification. Once
              approved, your verified coach badge is restored and you can sign off on player stat verifications.
            </p>
          </div>

          <ClaimCoachButton coachId={id} coachName={`${coach.first_name} ${coach.last_name}`} />
        </div>

        <div className="mt-6 text-center">
          <Link
            href={`/coaches/${id}`}
            className="text-brand-white/40 text-xs font-display uppercase tracking-widest hover:text-brand-yellow transition-colors"
          >
            ← Back to Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
