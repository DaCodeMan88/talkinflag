"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin";

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
  const supabase = await createClient();
  const payload = buildPayload(formData);
  if (!payload.first_name || !payload.last_name) {
    throw new Error("First and last name are required.");
  }
  const { data, error } = await supabase
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
  const supabase = await createClient();
  const payload = buildPayload(formData);
  if (!payload.first_name || !payload.last_name) {
    throw new Error("First and last name are required.");
  }
  const { error } = await supabase
    .from("players")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/players");
  revalidatePath(`/admin/players/${id}/edit`);
  revalidatePath(`/players/${id}`);
  revalidatePath("/players");
}

export async function deletePlayer(id: string) {
  if (!(await getAdminUser())) throw new Error("Not authorized");
  const supabase = await createClient();
  const { error } = await supabase.from("players").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/players");
  revalidatePath("/players");
  redirect("/admin/players");
}

export async function toggleClaim(id: string, claimed: boolean) {
  if (!(await getAdminUser())) throw new Error("Not authorized");
  const supabase = await createClient();
  // Admin can release a wrongly-claimed profile. We never force-claim to a user
  // here (that requires a user id) — we only clear a claim.
  const { error } = await supabase
    .from("players")
    .update(
      claimed
        ? { is_claimed: true }
        : { is_claimed: false, claimed_by: null, claimed_at: null }
    )
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/players/${id}/edit`);
  revalidatePath(`/players/${id}`);
}
