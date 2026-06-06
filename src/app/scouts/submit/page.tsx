import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/lib/seo";
import ScoutSubmitForm from "./ScoutSubmitForm";

export const metadata = buildMetadata({
  title: "Submit Player Stats | Talkin Flag Scouts",
  description: "Submit verified player measurables from your combine or testing event.",
  path: "/scouts/submit",
});

export default async function ScoutSubmitPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/scouts/submit");

  const { data: scout } = await supabase
    .from("scouts")
    .select("id, full_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!scout) {
    return (
      <div className="min-h-screen bg-brand-black pt-24 pb-20 px-4">
        <div className="max-w-lg mx-auto text-center space-y-4">
          <p className="text-brand-white/60 text-sm">You need to be an approved scout to submit stats.</p>
          <a
            href="/scouts/apply"
            className="inline-block bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-xs py-2 px-6 hover:bg-brand-yellow/90 transition-colors"
          >
            Apply to Be a Scout →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="border-l-4 border-brand-yellow pl-6 mb-10">
          <p className="text-brand-yellow text-xs font-display uppercase tracking-[0.3em] mb-2">
            Scout Portal · {scout.full_name}
          </p>
          <h1 className="font-display text-5xl uppercase text-brand-white leading-none">
            Submit Stats
          </h1>
          <p className="text-brand-white/40 mt-3 text-sm">
            Stats are submitted as pending and go live after admin review.
          </p>
        </div>

        <div className="bg-[#0d0d0d] border border-brand-white/10 p-8">
          <ScoutSubmitForm />
        </div>
      </div>
    </div>
  );
}
