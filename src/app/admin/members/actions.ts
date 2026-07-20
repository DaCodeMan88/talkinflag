"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/eval/admin-client";
import { getAdminUser } from "@/lib/admin";
import { sendEmail } from "@/lib/email";
import { nudgeEmailHtml, NUDGE_SUBJECT } from "@/lib/nudge";

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

export async function sendNudge(userId: string) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  const db = createAdminClient();
  const { data: userData } = await db.auth.admin.getUserById(userId);
  const email = userData?.user?.email;
  if (!email) throw new Error("This account has no email address.");

  const firstName = (userData.user?.user_metadata?.first_name as string | undefined) ?? null;
  const result = await sendEmail({ to: email, subject: NUDGE_SUBJECT, html: nudgeEmailHtml(firstName) });
  if (!result.ok) throw new Error(result.error ?? "Failed to send nudge email.");

  await db.from("profile_nudges").insert({ user_id: userId, source: "admin", sent_by: admin.id });
  revalidatePath("/admin/members");
}
