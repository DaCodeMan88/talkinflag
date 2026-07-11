import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/eval/admin-client";
import { classifyArchetype } from "@/lib/eval/archetype";
import { Fingerprint } from "@/lib/eval/dimensions";
import PerspectiveSummary from "@/components/eval/PerspectiveSummary";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your Evaluation Results | Talkin Flag",
  description: "Your saved athlete-evaluation perspective — archetype, radar and biopsychosocial read.",
  robots: { index: false, follow: false },
};

export default async function EvalResultsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/evaluate/results");

  const admin = createAdminClient();
  const [{ data: row }, { data: refRows }] = await Promise.all([
    admin
      .from("eval_responses")
      .select("fingerprint, science_rollup, role_at_submit, taken_at")
      .eq("user_id", user.id)
      .order("taken_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin.from("eval_reference").select("key, value"),
  ]);

  if (!row) {
    return (
      <main className="min-h-[70vh] grid place-items-center text-brand-white px-4 text-center">
        <div>
          <h1 className="font-display uppercase tracking-widest text-3xl">No results yet</h1>
          <p className="mt-3 text-white/70">You haven&apos;t taken the athlete evaluation.</p>
          <Link
            href="/evaluate"
            className="inline-block mt-6 bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm px-6 py-3 hover:bg-yellow-400 transition-colors"
          >
            Take the Evaluation
          </Link>
        </div>
      </main>
    );
  }

  const reference: Record<string, number> = {};
  for (const r of refRows ?? []) reference[r.key] = Number(r.value);

  // Blurb isn't stored — reclassify from the saved fingerprint (deterministic).
  const archetype = classifyArchetype(row.fingerprint as Fingerprint);

  return (
    <main className="pt-16">
      <PerspectiveSummary
        result={{
          fingerprint: row.fingerprint as Record<string, number>,
          scienceRollup: (row.science_rollup ?? {}) as Record<string, number>,
          archetype: { name: archetype.name, blurb: archetype.blurb },
          reference,
          role: row.role_at_submit,
        }}
      />
    </main>
  );
}
