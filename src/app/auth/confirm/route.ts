import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * Consumes email OTP links via token_hash (magic link, invite, recovery).
 * The /auth/callback route only handles PKCE ?code= exchanges, so links
 * generated outside the browser flow (admin generateLink, some mail clients
 * that prefetch and break the code exchange) land on /auth/auth-error.
 * This is the standard Supabase SSR companion route for those links.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  let next = searchParams.get("next") ?? "/dashboard";
  // Open-redirect guard: only allow local, non-protocol-relative paths.
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\") || next.includes("@")) {
    next = "/dashboard";
  }

  if (token_hash && type) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-error`);
}
