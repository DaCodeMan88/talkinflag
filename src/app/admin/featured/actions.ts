"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setFeaturedAthlete(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const playerId = formData.get("player_id") as string;
  const message = (formData.get("message") as string) || null;

  if (!playerId) throw new Error("Player ID required");

  const featuredFrom = new Date();
  const featuredUntil = new Date(featuredFrom);
  featuredUntil.setDate(featuredUntil.getDate() + 7);

  const { error } = await supabase.from("featured_athlete").insert({
    player_id: playerId,
    featured_from: featuredFrom.toISOString(),
    featured_until: featuredUntil.toISOString(),
    message,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin/featured");
  revalidatePath("/athletes/featured");
}

export async function removeFeaturedAthlete(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("featured_athlete")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin/featured");
  revalidatePath("/athletes/featured");
}
