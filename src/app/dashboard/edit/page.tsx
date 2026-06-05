import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/lib/seo";
import EditProfileForm from "./EditProfileForm";

export const metadata = buildMetadata({
  title: "Edit Profile | Talkin Flag",
  description: "Update your Talkin Flag player profile.",
  path: "/dashboard/edit",
});

export default async function EditProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/dashboard/edit");

  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("claimed_by", user.id)
    .eq("is_claimed", true)
    .single();

  if (!player) redirect("/dashboard");

  const stats = (player.stats ?? {}) as Record<string, unknown>;

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div className="border-l-4 border-brand-yellow pl-6">
            <h1 className="font-display text-4xl uppercase text-brand-white leading-none">
              Edit Profile
            </h1>
            <p className="text-brand-white/40 mt-2 text-sm">
              {player.first_name} {player.last_name} · {player.position}
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-brand-white/30 text-xs font-display uppercase tracking-widest hover:text-brand-yellow transition-colors"
          >
            ← Dashboard
          </Link>
        </div>

        <EditProfileForm
          player={{
            id: player.id,
            first_name: player.first_name,
            last_name: player.last_name,
            photo_url: player.photo_url ?? null,
            bio: player.bio ?? "",
            instagram: player.instagram ?? "",
            highlight_url: player.highlight_url ?? "",
            height_in: player.height_in ?? null,
            weight_lbs: player.weight_lbs ?? null,
            wingspan_in: (stats.wingspan_in as number) ?? null,
            forty_yard: (stats.forty_yard as string) ?? "",
            vertical_jump: (stats.vertical_jump as number) ?? null,
            years_active: (stats.years_active as number) ?? null,
            occupation: (stats.occupation as string) ?? "",
            education: (stats.education as string) ?? "",
            grad_year: player.grad_year ?? null,
          }}
        />
      </div>
    </div>
  );
}
