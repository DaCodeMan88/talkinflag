import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/eval/admin-client";
import { getEligibleRoles } from "@/lib/eval/eligibility";
import { kindsForRoles, type CareerRole } from "@/lib/career/kinds";
import { buildMetadata } from "@/lib/seo";
import CareerUpdateForm from "./CareerUpdateForm";

export const metadata = buildMetadata({
  title: "Career Updates | Talkin Flag",
  description: "Log a new championship, postseason run, role change, or clinic — keep your Talkin Flag profile current.",
  path: "/dashboard/credentials",
});

export const dynamic = "force-dynamic";

export default async function CredentialsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/dashboard/credentials");

  const roles = (await getEligibleRoles(user)).filter((r): r is CareerRole =>
    r === "coach" || r === "expert" || r === "player",
  );
  const kinds = kindsForRoles(roles).map((k) => ({ kind: k.kind, label: k.label, fields: k.fields }));

  // Own submissions (career_updates is RLS-locked → service-role read).
  const db = createAdminClient();
  const { data: mine } = await db
    .from("career_updates")
    .select("id, kind, detail, status, created_at")
    .eq("subject_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div className="border-l-4 border-brand-yellow pl-6">
            <h1 className="font-display text-4xl uppercase text-brand-white leading-none">
              Career Updates
            </h1>
            <p className="text-brand-white/40 mt-2 text-sm">
              New title, postseason run, role change, or clinic — keep your profile current.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-brand-white/30 text-xs font-display uppercase tracking-widest hover:text-brand-yellow transition-colors"
          >
            ← Dashboard
          </Link>
        </div>

        <div className="bg-brand-yellow/5 border border-brand-yellow/15 p-5 mb-8 text-brand-white/50 text-xs leading-relaxed">
          <p className="text-brand-white/70 font-display uppercase tracking-widest text-[11px] mb-2">How it works</p>
          Submit a career update with a link as evidence. Once an admin approves it, it appears on your public
          profile — and championship, postseason, and award updates feed into the next weekly ranking refresh.
        </div>

        <CareerUpdateForm
          kinds={kinds}
          mine={(mine ?? []).map((m) => ({
            id: m.id,
            kind: m.kind,
            title: (m.detail as Record<string, string>)?.title ?? (m.detail as Record<string, string>)?.new_role ?? "",
            status: m.status,
            created_at: m.created_at,
          }))}
        />
      </div>
    </div>
  );
}
