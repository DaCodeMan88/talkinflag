import { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { ADMIN_EMAILS } from "@/lib/admin";

/** One active claimed profile per account — shared by the claim route and self-submit. */
export async function hasClaimedProfile(db: SupabaseClient, userId: string): Promise<boolean> {
  const { data } = await db
    .from("players")
    .select("id")
    .eq("claimed_by", userId)
    .eq("is_claimed", true)
    .maybeSingle();
  return !!data;
}

/** Fire-and-forget audit log entry. Never throws — a logging failure must not fail the claim. */
export async function logClaimEvent(
  db: SupabaseClient,
  entry: {
    playerId: string;
    userId: string | null;
    action: "claim" | "release";
    actor: "self" | "admin";
    note?: string;
  }
) {
  try {
    const { error } = await db.from("claim_events").insert({
      player_id: entry.playerId,
      user_id: entry.userId,
      action: entry.action,
      actor: entry.actor,
      note: entry.note ?? null,
    });
    if (error) console.error("claim_events insert error:", error.message);
  } catch (err) {
    console.error("claim_events insert threw:", err);
  }
}

/** Fire-and-forget admin notification. Never throws — sendEmail already no-ops without RESEND_API_KEY. */
export async function notifyAdmins(subject: string, html: string) {
  try {
    await Promise.all(ADMIN_EMAILS.map((to) => sendEmail({ to, subject, html })));
  } catch (err) {
    console.error("notifyAdmins error:", err);
  }
}
