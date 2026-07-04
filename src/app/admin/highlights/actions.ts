"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/eval/admin-client";

export async function reviewHighlight(id: string, status: "approved" | "rejected" | "top10") {
  if (!(await getAdminUser())) throw new Error("Not authorized");
  const db = createAdminClient();

  const { error } = await db
    .from("highlight_submissions")
    .update({ status })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/highlights");
}

export async function publishTop10(formData: FormData) {
  if (!(await getAdminUser())) throw new Error("Not authorized");
  const db = createAdminClient();

  const week = formData.get("week") as string;
  if (!week) throw new Error("Week is required");

  // Collect ordered submission IDs from form
  const ids: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const id = formData.get(`rank_${i}`) as string;
    if (id) ids.push(id);
  }
  if (ids.length === 0) throw new Error("Select at least one highlight");

  // Update each selected highlight with its rank and week
  for (let i = 0; i < ids.length; i++) {
    const { error } = await db
      .from("highlight_submissions")
      .update({ status: "top10", week_featured: week, rank_in_week: i + 1 })
      .eq("id", ids[i]);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/highlights");
  revalidatePath("/plays");
  revalidatePath(`/plays/week/${week}`);
  revalidatePath("/");
}
