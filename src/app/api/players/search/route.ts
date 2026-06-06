import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const exclude = url.searchParams.get("exclude") ?? "";

  if (q.length < 2) return NextResponse.json({ players: [] });

  const supabase = await createClient();

  let query = supabase
    .from("players")
    .select("id, first_name, last_name, position, school_or_team, photo_url")
    .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,school_or_team.ilike.%${q}%`)
    .order("ranking_national", { ascending: true, nullsFirst: false })
    .limit(15);

  if (exclude) query = query.neq("id", exclude);

  const { data } = await query;
  return NextResponse.json({ players: data ?? [] });
}
