import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const formData = await request.formData();
  const video_url = (formData.get("video_url") as string)?.trim();
  const player_id = (formData.get("player_id") as string) || null;
  const play_type = (formData.get("play_type") as string) || null;
  const description = (formData.get("description") as string)?.trim() || null;

  if (!video_url) {
    return NextResponse.json({ error: "Video URL is required" }, { status: 400 });
  }

  // Basic URL validation
  try {
    new URL(video_url);
  } catch {
    return NextResponse.json({ error: "Invalid video URL" }, { status: 400 });
  }

  // Rate-limit: max 3 pending submissions per user
  const { count } = await supabase
    .from("highlight_submissions")
    .select("id", { count: "exact", head: true })
    .eq("submitted_by", user.id)
    .eq("status", "pending");

  if ((count ?? 0) >= 3) {
    return NextResponse.json(
      { error: "You already have 3 pending submissions. Wait for them to be reviewed." },
      { status: 429 }
    );
  }

  const { error } = await supabase.from("highlight_submissions").insert({
    submitted_by: user.id,
    player_id: player_id || null,
    video_url,
    play_type: play_type || null,
    description,
    status: "pending",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
