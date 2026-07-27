"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { getAdminUser } from "@/lib/admin";
import { logClaimEvent } from "@/lib/claims";
import { sendEmail } from "@/lib/email";
import { approveUpdate, denyUpdate } from "@/lib/review/transitions";
import { isDenialPreset } from "@/lib/review/denial-presets";
import { approvedLiveEmail, deniedEmail, claimApprovedEmail } from "@/lib/emails/lifecycle";

const POSITIONS = ["QB", "WR", "DB", "LB", "C", "Rusher", "Utility"];
const LEVELS = ["high_school", "college", "national"];

function str(fd: FormData, key: string): string | null {
  const v = (fd.get(key) as string | null)?.trim();
  return v ? v : null;
}
function int(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  if (v === null) return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

function buildPayload(fd: FormData) {
  const position = str(fd, "position");
  const level = str(fd, "level");
  const gender = str(fd, "gender");

  let stats: Record<string, unknown> = {};
  const rawStats = str(fd, "stats");
  if (rawStats) {
    try {
      const parsed = JSON.parse(rawStats);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        stats = parsed as Record<string, unknown>;
      } else {
        throw new Error("Stats must be a JSON object");
      }
    } catch {
      throw new Error("Stats field is not valid JSON. Use an object like {\"forty_yard\": 4.6}.");
    }
  }

  return {
    first_name: str(fd, "first_name") ?? "",
    last_name: str(fd, "last_name") ?? "",
    position: position && POSITIONS.includes(position) ? position : null,
    level: level && LEVELS.includes(level) ? level : null,
    school_or_team: str(fd, "school_or_team"),
    grad_year: int(fd, "grad_year"),
    city: str(fd, "city"),
    state: str(fd, "state"),
    country: str(fd, "country"),
    height_in: int(fd, "height_in"),
    weight_lbs: int(fd, "weight_lbs"),
    gender: gender === "male" || gender === "female" ? gender : null,
    bio: str(fd, "bio"),
    instagram: str(fd, "instagram"),
    highlight_url: str(fd, "highlight_url"),
    photo_url: str(fd, "photo_url"),
    is_verified: fd.get("is_verified") === "on",
    stats,
  };
}

export async function createPlayer(formData: FormData) {
  if (!(await getAdminUser())) throw new Error("Not authorized");
  const db = createServerClient();
  const payload = buildPayload(formData);
  if (!payload.first_name || !payload.last_name) {
    throw new Error("First and last name are required.");
  }
  const { data, error } = await db
    .from("players")
    .insert(payload)
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/admin/players");
  revalidatePath("/players");
  redirect(`/players/${data.id}`);
}

export async function updatePlayer(id: string, formData: FormData) {
  if (!(await getAdminUser())) throw new Error("Not authorized");
  const db = createServerClient();
  const payload = buildPayload(formData);
  if (!payload.first_name || !payload.last_name) {
    throw new Error("First and last name are required.");
  }
  const { error } = await db
    .from("players")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/players");
  revalidatePath(`/admin/players/${id}/edit`);
  revalidatePath(`/players/${id}`);
  revalidatePath("/players");
}

export async function approvePlayer(id: string) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Not authorized");
  const db = createServerClient();
  const { data: player, error } = await db
    .from("players").update(approveUpdate(admin.id)).eq("id", id)
    .select("first_name, claimed_by").single();
  if (error) throw new Error(error.message);
  if (player?.claimed_by) {
    const { data: u } = await db.auth.admin.getUserById(player.claimed_by);
    if (u?.user?.email) {
      const e = approvedLiveEmail(player.first_name);
      await sendEmail({ to: u.user.email, subject: e.subject, html: e.html });
    }
  }
  revalidatePath("/admin/players"); revalidatePath("/players");
}

export async function denyPlayer(id: string, presetKey: string, note?: string) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Not authorized");
  if (!isDenialPreset(presetKey)) throw new Error("Pick a denial reason.");
  const db = createServerClient();
  const { data: player, error } = await db
    .from("players").update(denyUpdate(admin.id, presetKey, note)).eq("id", id)
    .select("first_name, claimed_by").single();
  if (error) throw new Error(error.message);
  if (player?.claimed_by) {
    const { data: u } = await db.auth.admin.getUserById(player.claimed_by);
    if (u?.user?.email) {
      const e = deniedEmail(player.first_name, presetKey, note);
      await sendEmail({ to: u.user.email, subject: e.subject, html: e.html });
    }
  }
  revalidatePath("/admin/players"); revalidatePath("/players");
}

export async function deletePlayer(id: string) {
  if (!(await getAdminUser())) throw new Error("Not authorized");
  const db = createServerClient();
  const { error } = await db.from("players").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/players");
  revalidatePath("/players");
  redirect("/admin/players");
}

export async function toggleClaim(id: string, claimed: boolean) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Not authorized");
  const db = createServerClient();

  // Read the current claimant first so a release can be logged against them.
  const { data: before } = await db
    .from("players")
    .select("claimed_by")
    .eq("id", id)
    .single();

  // Admin can release a wrongly-claimed profile. We never force-claim to a user
  // here (that requires a user id) — we only clear a claim.
  const { error } = await db
    .from("players")
    .update(
      claimed
        ? { is_claimed: true }
        : { is_claimed: false, claimed_by: null, claimed_at: null, claim_pending: false }
    )
    .eq("id", id);
  if (error) throw new Error(error.message);

  if (!claimed && before?.claimed_by) {
    await logClaimEvent(db, { playerId: id, userId: before.claimed_by, action: "release", actor: "admin" });
  }

  revalidatePath(`/admin/players/${id}/edit`);
  revalidatePath(`/players/${id}`);
  revalidatePath("/players");
  revalidatePath("/admin/claims");
}

/** Approve a pending self-service claim: the profile then reads as claimed
 *  publicly and the claimant can edit it. */
export async function approveClaim(id: string) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Not authorized");
  const db = createServerClient();

  const { data: player } = await db
    .from("players")
    .select("first_name, last_name, claimed_by, claim_pending")
    .eq("id", id)
    .single();

  if (!player?.claim_pending) return; // nothing to approve

  const { error } = await db
    .from("players")
    .update({ claim_pending: false })
    .eq("id", id)
    .eq("claim_pending", true);
  if (error) throw new Error(error.message);

  await logClaimEvent(db, { playerId: id, userId: player.claimed_by, action: "claim", actor: "admin", note: "approved" });

  // Let the claimant know they're live.
  if (player.claimed_by) {
    const { data: userData } = await db.auth.admin.getUserById(player.claimed_by);
    const email = userData?.user?.email;
    if (email) {
      const e = claimApprovedEmail(player.first_name);
      await sendEmail({ to: email, subject: e.subject, html: e.html });
    }
  }

  revalidatePath(`/players/${id}`);
  revalidatePath("/players");
  revalidatePath("/admin/claims");
}
