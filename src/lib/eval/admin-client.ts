import { createClient } from "@supabase/supabase-js";

/** Service-role Supabase client for server-only privileged reads/writes
 *  (reading answer keys, writing responses, upserting aggregate weights). */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
