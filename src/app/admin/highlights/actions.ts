"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function reviewHighlight(id: string, status: "approved" | "rejected" | "top10") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("highlight_submissions")
    .update({ status })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/highlights");
}

export async function publishTop10(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

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
    const { error } = await supabase
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
