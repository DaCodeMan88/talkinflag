"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/eval/admin-client";
import { getAdminUser } from "@/lib/admin";

// Deletes the AUTH ACCOUNT only. Any claimed player profile is unlinked (reset to
// unclaimed), never deleted — player rows are managed in /admin/players.
export async function deleteMember(userId: string) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");
  if (admin.id === userId) throw new Error("You cannot delete your own account.");

  const db = createAdminClient();

  const { error: unlinkErr } = await db
    .from("players")
    .update({ claimed_by: null, is_claimed: false, claim_pending: false, claimed_at: null })
    .eq("claimed_by", userId);
  if (unlinkErr) throw new Error(`Failed to unlink player profile: ${unlinkErr.message}`);

  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) throw new Error(`Failed to delete member: ${error.message}`);

  revalidatePath("/admin/members");
}
