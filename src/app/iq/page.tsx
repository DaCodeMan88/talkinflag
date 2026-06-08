import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/lib/seo";
import { createAdminClient } from "@/lib/eval/admin-client";

export const metadata = buildMetadata({
  title: "Flag Football IQ | Talkin Flag",
  description:
    "Test your Flag Football IQ — 40 evergreen questions on rules, strategy, route concepts, and the 5v5 and 7v7 formats. Sourced from Talkin Flag's research.",
  path: "/iq",
});

export const dynamic = "force-dynamic";

export default async function IQLandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let best: number | null = null;
  if (user) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("iq_best")
      .select("score_pct")
      .eq("user_id", user.id)
      .eq("category", "general")
      .maybeSingle();
    best = data ? Number(data.score_pct) : null;
  }

  return (
    <main className="bg-brand-black min-h-screen text-brand-white">
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="font-display uppercase tracking-widest text-brand-yellow text-sm">Talkin Flag</p>
        <h1 className="font-display uppercase tracking-widest text-5xl sm:text-6xl mt-2 leading-none">Flag Football IQ</h1>
        <p className="mt-5 text-white/80 max-w-xl mx-auto">
          How well do you really know the game? 40 questions on rules, strategy, route concepts, and the 5v5 and 7v7
          formats — drawn from official rulebooks and the Talkin Flag research library.
        </p>

        <div className="mt-10 rounded-2xl bg-brand-gray border border-white/10 p-6 text-left max-w-md mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display uppercase tracking-widest text-xl">Core IQ</h2>
              <p className="text-white/60 text-sm">40 questions · rules, strategy, 5v5 & 7v7</p>
            </div>
            {best !== null && (
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-white/50">Your best</p>
                <p className="font-display text-2xl text-brand-yellow">{best.toFixed(0)}</p>
              </div>
            )}
          </div>
          <Link
            href="/iq/general"
            className="mt-5 block text-center rounded-full bg-brand-yellow text-brand-black font-display uppercase tracking-widest px-8 py-3"
          >
            {best !== null ? "Improve your score" : "Start the quiz"}
          </Link>
          {!user && <p className="mt-3 text-center text-[11px] text-white/40">You&apos;ll sign in first so we can save your IQ.</p>}
        </div>

        <p className="mt-8 text-xs text-white/40">
          Want to shape the rankings instead? Take the{" "}
          <Link href="/evaluate" className="text-brand-yellow underline">Evaluation Philosophy</Link>.
        </p>
      </div>
    </main>
  );
}
