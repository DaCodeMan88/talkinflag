import { buildMetadata } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CoachApplyForm from "./CoachApplyForm";

export const metadata = buildMetadata({
  title: "Coach Verification | Talkin Flag",
  description: "Apply for verified coach status on Talkin Flag. NCAA and national team coaches welcome.",
  path: "/coaches/apply",
});

export default async function CoachApplyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/coaches/apply");

  // Check if already applied
  const { data: existing } = await supabase
    .from("coaches")
    .select("id, status, first_name, last_name")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center px-4 pt-24 pb-20">
        <div className="max-w-md w-full">
          <div className="bg-[#0d0d0d] border border-brand-white/10 p-8 text-center space-y-4">
            {existing.status === "approved" ? (
              <>
                <div className="text-brand-yellow font-display text-4xl">✓</div>
                <h1 className="font-display text-2xl uppercase text-brand-white">You&apos;re Verified</h1>
                <p className="text-brand-white/50 text-sm">
                  {existing.first_name}, your coach account is active. You can now verify player stats.
                </p>
              </>
            ) : existing.status === "rejected" ? (
              <>
                <div className="text-brand-white/20 font-display text-4xl">✗</div>
                <h1 className="font-display text-2xl uppercase text-brand-white">Application Not Approved</h1>
                <p className="text-brand-white/50 text-sm">
                  Your application wasn&apos;t approved. Contact us at talkinflagshow@gmail.com if you believe this is an error.
                </p>
              </>
            ) : (
              <>
                <div className="text-brand-yellow font-display text-4xl">⏳</div>
                <h1 className="font-display text-2xl uppercase text-brand-white">Application Pending</h1>
                <p className="text-brand-white/50 text-sm">
                  Your application is under review. We&apos;ll email {user.email} once it&apos;s been processed.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="border-l-4 border-brand-yellow pl-6 mb-10">
          <h1 className="font-display text-4xl uppercase text-brand-white leading-none">
            Coach Verification
          </h1>
          <p className="text-brand-white/50 mt-3 text-sm leading-relaxed max-w-lg">
            Verified coaches can sign off on player stat submissions. Open to head coaches of NCAA programs, national teams, and high school programs.
          </p>
        </div>

        {/* What you get */}
        <div className="grid grid-cols-3 gap-px bg-brand-white/10 mb-10">
          {[
            { icon: "✓", label: "Verified Badge", sub: "On your coach profile" },
            { icon: "📋", label: "Stat Sign-offs", sub: "Approve player submissions" },
            { icon: "🏈", label: "Coach Directory", sub: "Listed on Talkin Flag" },
          ].map((item) => (
            <div key={item.label} className="bg-[#0a0a0a] p-5 text-center">
              <div className="text-2xl mb-2">{item.icon}</div>
              <p className="font-display text-xs uppercase tracking-widest text-brand-white mb-1">{item.label}</p>
              <p className="text-brand-white/30 text-[11px]">{item.sub}</p>
            </div>
          ))}
        </div>

        <CoachApplyForm userEmail={user.email ?? ""} />
      </div>
    </div>
  );
}
