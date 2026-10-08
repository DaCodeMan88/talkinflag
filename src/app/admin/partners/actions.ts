"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/eval/admin-client";
import { isPartnerUrl } from "@/lib/partners";

type Result = { error?: string };

function done(): Result {
  revalidatePath("/admin/partners");
  revalidatePath("/");
  return {};
}

function readFields(fd: FormData): { name: string; url: string } | { error: string } {
  const name = String(fd.get("name") ?? "").trim();
  const url = String(fd.get("url") ?? "").trim();
  if (!name) return { error: "Name is required." };
  if (!isPartnerUrl(url)) return { error: "Link must start with https:// (copy it from the browser's address bar)." };
  return { name, url };
}

export async function addPartner(fd: FormData): Promise<Result> {
  if (!(await getAdminUser())) return { error: "Not authorized" };
  const fields = readFields(fd);
  if ("error" in fields) return fields;

  const db = createAdminClient();
  const { data: last } = await db.from("partners").select("position").order("position", { ascending: false }).limit(1);
  const position = ((last?.[0]?.position as number | undefined) ?? -1) + 1;
  const { error } = await db.from("partners").insert({ ...fields, position, is_live: true });
  return error ? { error: error.message } : done();
}

export async function updatePartner(id: string, fd: FormData): Promise<Result> {
  if (!(await getAdminUser())) return { error: "Not authorized" };
  const fields = readFields(fd);
  if ("error" in fields) return fields;

  const { error } = await createAdminClient()
    .from("partners")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id);
  return error ? { error: error.message } : done();
}

export async function setPartnerLive(id: string, isLive: boolean): Promise<Result> {
  if (!(await getAdminUser())) return { error: "Not authorized" };
  const { error } = await createAdminClient()
    .from("partners")
    .update({ is_live: isLive, updated_at: new Date().toISOString() })
    .eq("id", id);
  return error ? { error: error.message } : done();
}

/** Swap with the neighbour above (-1) or below (+1) in the current order. */
export async function movePartner(id: string, direction: -1 | 1): Promise<Result> {
  if (!(await getAdminUser())) return { error: "Not authorized" };
  const db = createAdminClient();
  const { data } = await db.from("partners").select("id, position, name").order("position").order("name");
  const rows = (data ?? []) as { id: string; position: number }[];
  const i = rows.findIndex((r) => r.id === id);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= rows.length) return {};

  // Renumber 0..n-1 with the two rows swapped, so ties left by older edits
  // cannot make a move appear to do nothing.
  [rows[i], rows[j]] = [rows[j], rows[i]];
  for (let k = 0; k < rows.length; k++) {
    if (rows[k].position === k) continue;
    const { error } = await db.from("partners").update({ position: k }).eq("id", rows[k].id);
    if (error) return { error: error.message };
  }
  return done();
}

export async function deletePartner(id: string): Promise<Result> {
  if (!(await getAdminUser())) return { error: "Not authorized" };
  const { error } = await createAdminClient().from("partners").delete().eq("id", id);
  return error ? { error: error.message } : done();
}
