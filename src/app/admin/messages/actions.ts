"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin";

export async function setRead(id: string, isRead: boolean) {
  if (!(await getAdminUser())) throw new Error("Not authorized");
  const supabase = await createClient();
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
  const supabase = await createClient();
  const { error } = await supabase
    .from("contact_submissions")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}
