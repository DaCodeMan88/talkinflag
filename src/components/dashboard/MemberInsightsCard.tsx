import Link from "next/link";
import { createAdminClient } from "@/lib/eval/admin-client";

/**
 * Dashboard card surfacing the member's Evaluation archetype and Flag Football
 * IQ, with CTAs to take/improve each. Reads are owner-scoped (admin client,
 * filtered by userId).
 */
export default async function MemberInsightsCard({ userId }: { userId: string }) {
  const db = createAdminClient();
  const [{ data: evalRow }, { data: iqRow }] = await Promise.all([
    db.from("eval_responses").select("archetype, role_at_submit, taken_at").eq("user_id", userId).order("taken_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("iq_best").select("score_pct").eq("user_id", userId).eq("category", "general").maybeSingle(),
  ]);

  const archetype = evalRow?.archetype as string | undefined;
  const iq = iqRow ? Number(iqRow.score_pct) : null;

  return (
    <div className="grid sm:grid-cols-2 gap-4 mb-8">
      {/* Evaluation philosophy */}
      <div className="bg-[#0d0d0d] border border-brand-white/10 p-5">
        <p className="font-display uppercase tracking-widest text-brand-yellow text-xs">Your Evaluation Lens</p>
        {archetype ? (
          <>
            <p className="mt-2 font-display uppercase tracking-wide text-xl text-brand-white leading-tight">{archetype}</p>
            <Link href="/evaluate?retake=1" className="mt-3 inline-block text-xs uppercase tracking-widest text-brand-white/50 hover:text-brand-yellow">Retake →</Link>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-brand-white/70">Map how you judge an athlete in ~6 minutes.</p>
            <Link href="/evaluate" className="mt-3 inline-block rounded-full bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-xs px-5 py-2">Take the evaluation</Link>
          </>
        )}
      </div>

      {/* Flag IQ */}
      <div className="bg-[#0d0d0d] border border-brand-white/10 p-5">
        <p className="font-display uppercase tracking-widest text-brand-yellow text-xs">Flag Football IQ</p>
        {iq !== null ? (
          <>
            <p className="mt-2 font-display text-3xl text-brand-white">{iq.toFixed(0)}<span className="text-base text-brand-white/40"> / 100</span></p>
            <Link href="/iq/general" className="mt-2 inline-block text-xs uppercase tracking-widest text-brand-white/50 hover:text-brand-yellow">Improve your score →</Link>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-brand-white/70">Test your knowledge of rules, strategy & formats.</p>
            <Link href="/iq/general" className="mt-3 inline-block rounded-full bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-xs px-5 py-2">Take the quiz</Link>
          </>
        )}
      </div>
    </div>
  );
}
