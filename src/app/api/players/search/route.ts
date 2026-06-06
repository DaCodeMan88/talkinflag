import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ players: [] });

  const supabase = await createClient();
  const { data } = await supabase
    .from("players")
    .select("id, first_name, last_name, school_or_team")
    .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
    .limit(10);

  return NextResponse.json({ players: data ?? [] });
}
