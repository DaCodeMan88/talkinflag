import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FeaturedForm } from "./FeaturedForm";
import Link from "next/link";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "daniel@dubsportsentertainment.com";

type Player = {
  id: string;
  first_name: string;
  last_name: string;
  position: string | null;
  school_or_team: string | null;
  photo_url: string | null;
};

type FeaturedRow = {
  id: string;
  player_id: string;
  featured_from: string;
  featured_until: string;
  message: string | null;
  players: Player | null;
};

export default async function AdminFeaturedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/admin/featured");
  if (user.email !== ADMIN_EMAIL) {
    return (
      <div className="p-8 text-white">
        <p className="text-red-400 font-medium">Not authorized.</p>
      </div>
    );
  }

  // Get current active featured athlete
  const now = new Date().toISOString();
  const { data: currentRaw } = await supabase
    .from("featured_athlete")
    .select("id, player_id, featured_from, featured_until, message, players(id, first_name, last_name, position, school_or_team, photo_url)")
    .gte("featured_until", now)
    .order("featured_from", { ascending: false })
    .limit(1)
    .single();

  // Get all players for search
  const { data: playersRaw } = await supabase
    .from("players")
    .select("id, first_name, last_name, position, school_or_team, photo_url")
    .order("first_name");

  const current = currentRaw as unknown as FeaturedRow | null;
  const players = (playersRaw ?? []) as Player[];

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="flex items-center gap-4 mb-2">
        <Link
          href="/admin"
          className="text-white/30 hover:text-white/60 text-xs font-display uppercase tracking-widest transition-colors"
        >
          ← Admin
        </Link>
      </div>
      <div className="border-l-4 border-[#FDDD58] pl-6 mb-10">
        <h1 className="font-display text-4xl uppercase text-white leading-none">
          Featured Athlete
        </h1>
        <p className="text-white/40 mt-2 text-sm">
          Select the Athlete Profile of the Week. Featured for 7 days on the homepage.
        </p>
      </div>

      <FeaturedForm players={players} current={current} />
    </div>
  );
}
