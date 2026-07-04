"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/eval/admin-client";

export async function setRead(id: string, isRead: boolean) {
  if (!(await getAdminUser())) throw new Error("Not authorized");
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("contact_submissions")
    .update({ is_read: isRead })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}

export async function setArchived(id: string, archived: boolean) {
  if (!(await getAdminUser())) throw new Error("Not authorized");
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("contact_submissions")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}
