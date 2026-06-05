import Link from "next/link";
import { buildMetadata } from "@/lib/seo";

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

  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center px-4 pt-24 pb-20">
      <div className="max-w-md w-full">
        <div className="border-l-4 border-brand-yellow pl-6 mb-10">
          <h1 className="font-display text-4xl uppercase text-brand-white leading-none">
            Claim Your Profile
          </h1>
          <p className="text-brand-white/50 mt-3 text-sm leading-relaxed">
            Create a free account to claim this profile, add your photo, bio, and social links.
          </p>
        </div>

        <div className="bg-[#0d0d0d] border border-brand-white/10 p-8 space-y-4">
          {/* Coming soon state — replace with auth form in next step */}
          <div className="text-center py-6">
            <div className="text-4xl mb-4">🏈</div>
            <p className="text-brand-white/60 text-sm mb-2">Player sign-up is coming soon.</p>
            <p className="text-brand-white/30 text-xs">
              We&apos;re building the full auth flow. Check back shortly.
            </p>
          </div>

          <div className="border-t border-brand-white/10 pt-4">
            <p className="text-brand-white/25 text-xs text-center">
              Profile ID: {id}
            </p>
          </div>
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
