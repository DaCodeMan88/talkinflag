"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addEventResult(eventId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const team_name = (formData.get("team_name") as string)?.trim();
  if (!team_name) throw new Error("Team name is required");

  const place = formData.get("place") ? parseInt(formData.get("place") as string) : null;
  const division = (formData.get("division") as string)?.trim() || null;
  const score = (formData.get("score") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  const { error } = await supabase.from("event_results").insert({
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("event_results").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/events/${eventId}/results`);
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/results");
}
