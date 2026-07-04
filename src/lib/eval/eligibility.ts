import { createAdminClient } from "./admin-client";
import { isAdminEmail } from "@/lib/admin";

/**
 * Which poll constituencies a member qualifies for. Derived from systems the
 * owners already operate — no separate approval UI to maintain:
 *   host   = site admin email (Ambra & Tika; ADMIN_EMAILS / ADMIN_EMAIL)
 *   coach  = a verified row in `coaches` (approved at /admin/coaches)
 *   expert = an approved row in `scouts` (approved at /admin/scouts)
 * Everyone else answers as a Player (insight only, no poll weight).
 */
export async function getEligibleRoles(user: { id: string; email?: string | null }): Promise<string[]> {
  const roles: string[] = [];

  if (isAdminEmail(user.email)) roles.push("host");

  const db = createAdminClient();
  const { data: coach } = await db
    .from("coaches")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_verified", true)
    .maybeSingle();
  if (coach) roles.push("coach");

  const { data: scout } = await db
    .from("scouts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (scout) roles.push("expert");

  return roles;
}
