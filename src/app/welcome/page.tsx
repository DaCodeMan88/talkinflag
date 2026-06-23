import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Welcome | Talkin Flag",
  description: "Get started on Talkin Flag — the global flag football hub.",
  path: "/welcome",
});

export const dynamic = "force-dynamic";

const MEMBER_FEATURES = [
  { title: "Claim your profile", body: "Find your player card and make it yours — coaches and scouts search the database every week." },
  { title: "Get verified & ranked", body: "Submit measurables for the ✓ badge. Verified stats carry the most weight in the TF Rankings." },
  { title: "Evaluation & Flag IQ", body: "Map how you judge talent and test your knowledge of rules, formats, and strategy." },
];

const ADMIN_FEATURES = [
  { title: "Manage everything", body: "Add and edit any player, approve coaches/scouts, review verifications, events, and highlights." },
  { title: "Contact inbox", body: "Every message from the site lands in your admin inbox — reply, mark read, and archive." },
  { title: "Run the rankings", body: "Recompute the community-weighted TF Rankings whenever polls or verified stats change." },
];

export default async function WelcomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/welcome");

  const admin = isAdminEmail(user.email);
  const features = admin ? ADMIN_FEATURES : MEMBER_FEATURES;
  const tourHref = admin ? "/admin?tour=1" : "/dashboard?tour=1";
  const skipHref = admin ? "/admin" : "/dashboard";

  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center px-4 pt-24 pb-20">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <p className="font-display text-xs uppercase tracking-[0.3em] text-brand-yellow mb-3">
            {admin ? "Admin Access" : "You're In"}
          </p>
          <h1 className="font-display text-5xl md:text-6xl uppercase text-brand-white leading-none">
            Welcome to<br />Talkin Flag
          </h1>
          <p className="text-brand-white/50 mt-5 text-sm leading-relaxed max-w-md mx-auto">
            {admin
              ? "You can run nearly everything about the site and brand from your admin panel. Want a quick tour?"
              : "The global hub for flag football players, coaches, and fans. Want us to show you around?"}
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-10">
          {features.map((f) => (
            <div key={f.title} className="bg-[#0d0d0d] border border-brand-white/10 p-5">
              <p className="font-display uppercase text-brand-yellow text-sm tracking-wide leading-tight mb-2">
                {f.title}
              </p>
              <p className="text-brand-white/50 text-xs leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={tourHref}
            className="w-full sm:w-auto text-center bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm py-3 px-8 hover:bg-brand-yellow/90 transition-colors"
          >
            Show me around
          </Link>
          <Link
            href={skipHref}
            className="w-full sm:w-auto text-center text-brand-white/50 font-display uppercase tracking-widest text-xs py-3 px-6 hover:text-brand-yellow transition-colors"
          >
            I&apos;ll explore on my own →
          </Link>
        </div>
      </div>
    </div>
  );
}
