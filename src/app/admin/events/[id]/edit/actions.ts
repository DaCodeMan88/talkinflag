"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/eval/admin-client";
import { parseEventForm } from "@/lib/events/edit";

export async function updateEvent(eventId: string, formData: FormData): Promise<{ error?: string }> {
  if (!(await getAdminUser())) return { error: "Not authorized" };

  const parsed = parseEventForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const db = createAdminClient();
  const { error } = await db.from("events").update(parsed.value).eq("id", eventId);
  if (error) return { error: error.message };

  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath("/events/[id]", "page");
  revalidatePath("/results");
  revalidatePath("/");
  return {};
}
