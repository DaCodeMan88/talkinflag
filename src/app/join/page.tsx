import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@/lib/supabase";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Join Talkin Flag",
  description: "Create your flag football player profile. Get discovered by coaches, scouts, and national team selectors worldwide. Free, always.",
  path: "/join",
});

export default async function JoinPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/join");

  const db = createServerClient();
  const { data: player } = await db
    .from("players")
    .select("id, is_approved")
    .eq("claimed_by", user.id)
    .eq("is_claimed", true)
    .maybeSingle();

  if (player?.is_approved) redirect("/dashboard");

  if (player && !player.is_approved) {
    return (
      <div className="min-h-screen bg-brand-black pt-24 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-brand-yellow/10 border-2 border-brand-yellow/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">⏳</span>
          </div>
          <h1 className="font-display text-3xl uppercase text-brand-yellow mb-3">Under Review</h1>
          <p className="text-brand-white/60 mb-8 leading-relaxed">
            Your profile is linked to your account and being reviewed by our team — usually within 48 hours.
            You can keep editing it from your dashboard in the meantime.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm px-8 py-4 hover:bg-yellow-400 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="border-l-4 border-brand-yellow pl-6 mb-12">
          <h1 className="font-display text-5xl uppercase text-brand-white leading-none">Join Talkin Flag</h1>
          <p className="text-brand-white/50 mt-3 text-sm leading-relaxed">
            Signed in as {user.email}. Are you already in our database?
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <Link
            href="/players"
            className="bg-[#0d0d0d] border border-brand-white/10 hover:border-brand-yellow/40 transition-colors p-8 text-center space-y-3"
          >
            <p className="font-display text-xl uppercase text-brand-white">Find Your Profile</p>
            <p className="text-brand-white/40 text-sm leading-relaxed">
              Most national, college, and high school athletes are already seeded. Search and claim yours.
            </p>
            <span className="inline-block text-brand-yellow text-xs font-display uppercase tracking-widest">Search Players →</span>
          </Link>

          <Link
            href="/players/submit"
            className="bg-[#0d0d0d] border border-brand-white/10 hover:border-brand-yellow/40 transition-colors p-8 text-center space-y-3"
          >
            <p className="font-display text-xl uppercase text-brand-white">Create Your Profile</p>
            <p className="text-brand-white/40 text-sm leading-relaxed">
              Not listed yet? Create your own profile — free, and linked to your account from the start.
            </p>
            <span className="inline-block text-brand-yellow text-xs font-display uppercase tracking-widest">Get Started →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
