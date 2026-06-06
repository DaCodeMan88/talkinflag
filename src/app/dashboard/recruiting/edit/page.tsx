import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EditCoachForm from "./EditCoachForm";

export const metadata = { title: "Edit Coach Profile | Talkin Flag" };

export default async function EditCoachProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/dashboard/recruiting/edit");

  const { data: coach } = await supabase
    .from("coaches")
    .select("id, first_name, last_name, team, level, title, years_coaching, wins, losses, philosophy, bio")
    .eq("user_id", user.id)
    .eq("is_verified", true)
    .single();

  if (!coach) redirect("/dashboard/recruiting");

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <Link
            href="/dashboard/recruiting"
            className="text-brand-white/30 text-xs font-display uppercase tracking-widest hover:text-brand-yellow transition-colors"
          >
            ← Back to Dashboard
          </Link>
          <div className="border-l-4 border-brand-yellow pl-6 mt-6">
            <h1 className="font-display text-4xl uppercase text-brand-white leading-none">
              Edit Profile
            </h1>
            <p className="text-brand-white/40 mt-2 text-sm">
              {coach.first_name} {coach.last_name} · {coach.team}
            </p>
          </div>
        </div>

        <div className="bg-[#0d0d0d] border border-brand-white/10 p-8">
          <EditCoachForm
            title={coach.title}
            years_coaching={coach.years_coaching}
            wins={coach.wins}
            losses={coach.losses}
            philosophy={coach.philosophy}
            bio={coach.bio}
          />
        </div>
      </div>
    </div>
  );
}
