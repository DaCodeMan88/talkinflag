import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminUser } from "@/lib/admin";
import PlayerEditForm from "../PlayerEditForm";

export const dynamic = "force-dynamic";

export default async function NewPlayerPage() {
  if (!(await getAdminUser())) redirect("/");

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="border-l-4 border-[#FDDD58] pl-6 mb-10">
        <Link href="/admin/players" className="text-white/40 text-xs hover:text-white transition-colors">← Players</Link>
        <h1 className="font-display text-4xl uppercase text-white leading-none mt-1">Add Player</h1>
        <p className="text-white/40 mt-2 text-sm">Create a new athlete record</p>
      </div>
      <PlayerEditForm />
    </div>
  );
}
