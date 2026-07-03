"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/admin";
import { createServerClient } from "@/lib/supabase";
import { toggleClaim } from "../players/actions";

export async function releaseFromReport(reportId: string, playerId: string) {
  if (!(await getAdminUser())) throw new Error("Not authorized");
  await toggleClaim(playerId, false);

  const db = createServerClient();
  const { error } = await db
    .from("profile_reports")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", reportId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/reports");
}

export async function dismissReport(reportId: string) {
  if (!(await getAdminUser())) throw new Error("Not authorized");
  const db = createServerClient();
  const { error } = await db
    .from("profile_reports")
    .update({ status: "dismissed" })
    .eq("id", reportId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/reports");
}
