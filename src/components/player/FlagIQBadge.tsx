// Optional polish: surface a claimed member's best Flag IQ on their public
// profile. Server component; iq_best is read via the service-role client.
import Link from "next/link";
import { createAdminClient } from "@/lib/eval/admin-client";

export default async function FlagIQBadge({ userId }: { userId: string | null | undefined }) {
  if (!userId) return null;
  const db = createAdminClient();
  const { data } = await db
    .from("iq_best")
    .select("score_pct")
    .eq("user_id", userId)
    .eq("category", "general")
    .maybeSingle();

  if (data?.score_pct == null) return null;
  const pct = Math.round(Number(data.score_pct));

  return (
    <div className="max-w-3xl mx-auto px-6 mt-12 text-center">
      <Link
        href="/iq"
        className="inline-flex items-center gap-3 border border-brand-yellow/30 bg-brand-yellow/5 px-5 py-3 hover:border-brand-yellow/60 transition-colors"
      >
        <span className="font-display uppercase tracking-widest text-brand-white/50 text-[11px]">Flag IQ</span>
        <span className="font-display text-2xl text-brand-yellow leading-none">{pct}</span>
      </Link>
    </div>
  );
}
