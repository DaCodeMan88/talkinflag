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

  let bestGeneral: number | null = null;
  let bestCoach: number | null = null;
  if (user) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("iq_best")
      .select("category, score_pct")
      .eq("user_id", user.id)
      .in("category", ["general", "coach"]);
    for (const row of data ?? []) {
      if (row.category === "general") bestGeneral = Number(row.score_pct);
      else if (row.category === "coach") bestCoach = Number(row.score_pct);
    }
  }

  const cards = [
    {
      href: "/iq/general",
      title: "Core IQ",
      meta: "40 questions · rules, strategy, 5v5 & 7v7",
      blurb: "How well do you really know the game?",
      best: bestGeneral,
    },
    {
      href: "/iq/coach",
      title: "Coach IQ",
      meta: "32 questions · scheme, situational calls, evaluation",
      blurb: "Establish coaching credibility — your score feeds your voting influence in the rankings.",
      best: bestCoach,
      badge: "Counts toward coach influence",
    },
  ];

  return (
    <main className="bg-brand-black min-h-screen text-brand-white">
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="font-display uppercase tracking-widest text-brand-yellow text-sm">Talkin Flag</p>
        <h1 className="font-display uppercase tracking-widest text-5xl sm:text-6xl mt-2 leading-none">Flag Football IQ</h1>
        <p className="mt-5 text-white/80 max-w-xl mx-auto">
          Test your knowledge of the game — drawn from official rulebooks and the Talkin Flag research library.
          Your progress saves automatically, so you can pick up where you left off.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto text-left">
          {cards.map((c) => (
            <div key={c.href} className="flex flex-col rounded-2xl bg-brand-gray border border-white/10 p-6 transition hover:border-brand-yellow/50">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display uppercase tracking-widest text-xl">{c.title}</h2>
                  <p className="text-white/60 text-sm mt-0.5">{c.meta}</p>
                </div>
                {c.best !== null && (
                  <div className="text-right shrink-0">
                    <p className="text-[10px] uppercase tracking-widest text-white/50">Your best</p>
                    <p className="font-display text-2xl text-brand-yellow leading-none">{c.best.toFixed(0)}</p>
                  </div>
                )}
              </div>
              <p className="text-white/50 text-xs mt-3 leading-relaxed flex-1">{c.blurb}</p>
              {c.badge && (
                <p className="mt-3 inline-block self-start text-[10px] font-display uppercase tracking-widest text-brand-yellow border border-brand-yellow/30 rounded-full px-2 py-1">
                  {c.badge}
                </p>
              )}
              <Link
                href={c.href}
                className="mt-5 block text-center rounded-full bg-brand-yellow text-brand-black font-display uppercase tracking-widest px-8 py-3 hover:bg-brand-yellow/90 transition"
              >
                {c.best !== null ? "Improve your score" : "Start the quiz"}
              </Link>
            </div>
          ))}
        </div>

        {!user && <p className="mt-5 text-center text-[11px] text-white/40">You&apos;ll sign in first so we can save your IQ.</p>}

        <p className="mt-8 text-xs text-white/40">
          Want to shape the rankings instead? Take the{" "}
          <Link href="/evaluate" className="text-brand-yellow underline">Evaluation Philosophy</Link>.
        </p>
      </div>
    </main>
  );
}
