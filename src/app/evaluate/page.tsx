import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/lib/seo";
import { loadActiveItems, stripAnswers } from "@/lib/eval/load";
import { DIMENSION_LABELS, DimensionKey } from "@/lib/eval/dimensions";
import EvaluationRunner, { Section } from "@/components/eval/EvaluationRunner";

export const metadata = buildMetadata({
  title: "How Do You Judge an Athlete? | Talkin Flag",
  description:
    "Take the Talkin Flag Evaluation Philosophy — 100 quick questions that map how you judge a flag football athlete, then see your perspective and archetype.",
  path: "/evaluate",
});

export const dynamic = "force-dynamic";

export default async function EvaluatePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/evaluate");

  const { data: roles } = await supabase
    .from("member_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("status", "approved")
    .in("role", ["host", "coach", "expert"]);
  const eligibleRoles = (roles ?? []).map((r) => r.role as string);

  const active = await loadActiveItems();
  if (!active || active.items.length === 0) {
    return (
      <main className="min-h-[70vh] grid place-items-center text-brand-white px-4 text-center">
        <div>
          <h1 className="font-display uppercase tracking-widest text-3xl">Evaluation coming soon</h1>
          <p className="mt-3 text-white/70">The questionnaire isn&apos;t live yet. Check back shortly.</p>
        </div>
      </main>
    );
  }

  const items = active.items.map(stripAnswers);

  // Sections in display order (unique section_key as they appear by ordinal).
  const seen = new Set<string>();
  const sections: Section[] = [];
  for (const it of items) {
    if (!seen.has(it.section_key)) {
      seen.add(it.section_key);
      sections.push({ key: it.section_key, label: DIMENSION_LABELS[it.section_key as DimensionKey] ?? it.section_key });
    }
  }

  return (
    <main className="bg-brand-black min-h-screen">
      <EvaluationRunner items={items} sections={sections} eligibleRoles={eligibleRoles} />
    </main>
  );
}
