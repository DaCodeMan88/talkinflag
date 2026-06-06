import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAIL = "daniel@dubsportsentertainment.com";

export default async function AdminHomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) redirect("/");

  const [
    { count: pendingVerifications },
    { count: pendingCoaches },
    { count: pendingScouts },
  ] = await Promise.all([
    supabase
      .from("stat_verifications")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("coaches")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("scout_applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const sections = [
    {
      label: "Verifications",
      description: "Player stat verification requests",
      href: "/admin/verifications",
      count: pendingVerifications ?? 0,
    },
    {
      label: "Coaches",
      description: "Coach profile applications",
      href: "/admin/coaches",
      count: pendingCoaches ?? 0,
    },
    {
      label: "Scouts",
      description: "Scout access applications",
      href: "/admin/scouts",
      count: pendingScouts ?? 0,
    },
  ];

  const totalPending = (pendingVerifications ?? 0) + (pendingCoaches ?? 0) + (pendingScouts ?? 0);

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="border-l-4 border-[#FDDD58] pl-6 mb-10">
        <h1 className="font-display text-4xl uppercase text-white leading-none">Admin</h1>
        <p className="text-white/40 mt-2 text-sm">
          {totalPending === 0 ? "All clear — no pending items." : `${totalPending} item${totalPending === 1 ? "" : "s"} pending review`}
        </p>
      </div>

      <div className="space-y-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="flex items-center justify-between bg-[#0d0d0d] border border-white/10 hover:border-[#FDDD58]/40 transition-colors p-5 group"
          >
            <div>
              <p className="font-display text-lg uppercase text-white group-hover:text-[#FDDD58] transition-colors tracking-wide">
                {s.label}
              </p>
              <p className="text-white/30 text-xs mt-0.5">{s.description}</p>
            </div>
            <div className="flex items-center gap-4 shrink-0 ml-4">
              {s.count > 0 ? (
                <span className="bg-[#FDDD58] text-black font-display text-sm px-3 py-1 uppercase tracking-widest">
                  {s.count} pending
                </span>
              ) : (
                <span className="text-white/20 font-display text-xs uppercase tracking-widest">✓ Clear</span>
              )}
              <span className="text-white/20 group-hover:text-[#FDDD58] transition-colors">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
