import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  // Strip characters meaningful in a PostgREST .or() filter string (commas
  // separate conditions, parens group, % is the ilike wildcard) to prevent
  // filter injection before interpolating the search term below.
  const q = (url.searchParams.get("q") ?? "").replace(/[,()*\\:%]/g, " ").trim();
  const exclude = url.searchParams.get("exclude") ?? "";

  if (q.length < 2) return NextResponse.json({ players: [] });

  const supabase = createServerClient();

  let query = supabase
    .from("players")
    .select("id, first_name, last_name, position, school_or_team, photo_url")
    .eq("is_approved", true)
    .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,school_or_team.ilike.%${q}%`)
    .order("ranking_national", { ascending: true, nullsFirst: false })
    .limit(15);

  if (exclude) query = query.neq("id", exclude);

  const { data } = await query;
  return NextResponse.json({ players: data ?? [] });
}
