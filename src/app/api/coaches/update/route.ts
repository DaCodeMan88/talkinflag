import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, years_coaching, wins, losses, philosophy, bio } = body;

  const { error } = await supabase
    .from("coaches")
    .update({
      title: title || null,
      years_coaching: years_coaching !== "" ? Number(years_coaching) : null,
      wins: wins !== "" ? Number(wins) : null,
      losses: losses !== "" ? Number(losses) : null,
      philosophy: philosophy || null,
      bio: bio || null,
    })
    .eq("user_id", user.id)
    .eq("is_verified", true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
