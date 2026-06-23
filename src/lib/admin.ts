import { createClient } from "@/lib/supabase/server";

/**
 * Admin emails are configured via env. `ADMIN_EMAILS` (comma-separated) is the
 * canonical list; `ADMIN_EMAIL` (singular) is the legacy fallback. The hardcoded
 * default keeps the shared owner account working even before env vars are set.
 */
export const ADMIN_EMAILS = (
  process.env.ADMIN_EMAILS ??
  process.env.ADMIN_EMAIL ??
  "talkinflagshow@gmail.com"
)
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Returns the signed-in user if (and only if) they are an admin, otherwise null.
 * Use in server components/actions to gate admin surfaces.
 */
export async function getAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) return null;
  return user;
}
