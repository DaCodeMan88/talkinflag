"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/eval/admin-client";

export async function addEventResult(eventId: string, formData: FormData) {
  if (!(await getAdminUser())) throw new Error("Not authorized");
  const db = createAdminClient();

  const team_name = (formData.get("team_name") as string)?.trim();
  if (!team_name) throw new Error("Team name is required");

  const place = formData.get("place") ? parseInt(formData.get("place") as string) : null;
  const division = (formData.get("division") as string)?.trim() || null;
  const score = (formData.get("score") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  const { error } = await db.from("event_results").insert({
    event_id: eventId,
    team_name,
    place,
    division,
    score,
    notes,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/events/${eventId}/results`);
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/results");
}

export async function deleteEventResult(id: string, eventId: string) {
  if (!(await getAdminUser())) throw new Error("Not authorized");
  const db = createAdminClient();

  const { error } = await db.from("event_results").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/events/${eventId}/results`);
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/results");
}
