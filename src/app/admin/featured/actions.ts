"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/eval/admin-client";

export async function setFeaturedAthlete(formData: FormData) {
  if (!(await getAdminUser())) throw new Error("Not authorized");
  const db = createAdminClient();

  const playerId = formData.get("player_id") as string;
  const message = (formData.get("message") as string) || null;

  if (!playerId) throw new Error("Player ID required");

  const featuredFrom = new Date();
  const featuredUntil = new Date(featuredFrom);
  featuredUntil.setDate(featuredUntil.getDate() + 7);

  const { error } = await db.from("featured_athlete").insert({
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
  if (!(await getAdminUser())) throw new Error("Not authorized");
  const db = createAdminClient();

  const { error } = await db
    .from("featured_athlete")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin/featured");
  revalidatePath("/athletes/featured");
}
