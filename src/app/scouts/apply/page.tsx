import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/lib/seo";
import ScoutApplyForm from "./ScoutApplyForm";

export const metadata = buildMetadata({
  title: "Become a Scout | Talkin Flag",
  description: "Apply to become a Talkin Flag scout. Run combines and testing events, submit player measurables, and help build the future of flag football.",
  path: "/scouts/apply",
});

export default async function ScoutApplyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let defaultName = "";
  let defaultEmail = user?.email ?? "";

  if (user) {
    const { data: scout } = await supabase
      .from("scouts")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (scout) {
      return (
        <div className="min-h-screen bg-brand-black pt-24 pb-20 px-4">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <p className="text-brand-yellow font-display text-2xl uppercase">You&apos;re already an approved scout.</p>
            <a href="/scouts/submit" className="inline-block bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-xs py-2 px-6">
              Submit Player Stats →
            </a>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20 px-4">
      <div className="max-w-2xl mx-auto">

        <div className="border-l-4 border-brand-yellow pl-6 mb-10">
          <p className="text-brand-yellow text-xs font-display uppercase tracking-[0.3em] mb-2">
            Scout Program
          </p>
          <h1 className="font-display text-5xl uppercase text-brand-white leading-none">
            Become a Scout
          </h1>
          <p className="text-brand-white/50 mt-4 text-sm leading-relaxed max-w-lg">
            Talkin Flag scouts run combines and testing events, measure athletes on-site, and submit verified stats directly into our database.
            Powered by the All22 model — real events, real data, real credibility.
          </p>
        </div>

        {/* What scouts do */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-brand-white/5 mb-10">
          {[
            { title: "Run Events", body: "Organize or attend flag football combines and showcases in your region." },
            { title: "Measure Athletes", body: "Record 40-yard dash, vertical jump, weight, height, and more on-site." },
            { title: "Submit Data", body: "Upload verified measurables directly into the Talkin Flag database." },
          ].map((item) => (
            <div key={item.title} className="bg-[#0d0d0d] p-6">
              <p className="text-brand-yellow font-display uppercase tracking-widest text-xs mb-2">{item.title}</p>
              <p className="text-brand-white/50 text-sm leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#0d0d0d] border border-brand-white/10 p-8">
          <h2 className="font-display text-xl uppercase text-brand-white mb-6">Application</h2>
          <ScoutApplyForm defaultName={defaultName} defaultEmail={defaultEmail} />
        </div>

      </div>
    </div>
  );
}
