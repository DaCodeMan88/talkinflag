import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify this player is claimed by this user
  const { data: player } = await supabase
    .from("players")
    .select("id, claimed_by, is_claimed")
    .eq("id", id)
    .single();

  if (!player || !player.is_claimed || player.claimed_by !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("photo") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "File must be JPG, PNG, or WebP" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File must be under 5MB" }, { status: 400 });
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${id}/avatar.${ext}`;
  const bytes = await file.arrayBuffer();

  // Delete old photo first (ignore error if none exists)
  await supabase.storage.from("player-photos").remove([
    `${id}/avatar.jpg`,
    `${id}/avatar.png`,
    `${id}/avatar.webp`,
  ]);

  const { error: uploadError } = await supabase.storage
    .from("player-photos")
    .upload(path, bytes, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage
    .from("player-photos")
    .getPublicUrl(path);

  // Cache-bust with timestamp
  const photoUrl = `${publicUrl}?t=${Date.now()}`;

  await supabase.from("players").update({ photo_url: photoUrl }).eq("id", id);

  return NextResponse.json({ photo_url: photoUrl });
}
