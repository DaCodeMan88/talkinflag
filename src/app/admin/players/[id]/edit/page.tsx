import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/eval/admin-client";
import type { Player } from "@/types/player";
import PlayerEditForm from "../../PlayerEditForm";

export const dynamic = "force-dynamic";

export default async function EditPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await getAdminUser())) redirect("/");
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!player) notFound();

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="border-l-4 border-[#FDDD58] pl-6 mb-10">
        <Link href="/admin/players" className="text-white/40 text-xs hover:text-white transition-colors">← Players</Link>
        <h1 className="font-display text-4xl uppercase text-white leading-none mt-1">
          {player.first_name} {player.last_name}
        </h1>
        <div className="flex items-center gap-3 mt-2">
          <Link href={`/players/${player.id}`} className="text-[#FDDD58] text-xs font-display uppercase tracking-widest hover:underline">
            View public profile →
          </Link>
          {player.is_claimed && (
            <span className="text-white/30 text-xs font-display uppercase tracking-widest">· Claimed</span>
          )}
        </div>
      </div>
      <PlayerEditForm player={player as Player} />
    </div>
  );
}
