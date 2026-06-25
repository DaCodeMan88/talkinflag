import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { sendEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/dashboard";
  // Open-redirect guard: only allow local, non-protocol-relative paths.
  // Blocks values like "@evil.com", "//evil.com", "/\evil.com".
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\") || next.includes("@")) {
    next = "/dashboard";
  }

  if (code) {
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

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      let destination = next;
      // Detect first sign-in: send welcome email + route to the onboarding page.
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const createdAt = new Date(user.created_at).getTime();
          const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : 0;
          const isFirstLogin = Math.abs(lastSignIn - createdAt) < 60_000;
          if (isFirstLogin) {
            // Only override the default landing — never hijack an explicit
            // destination like a profile-claim flow.
            if (next === "/dashboard") destination = "/welcome";
            await sendEmail({
              to: user.email,
              subject: "Welcome to Talkin Flag 🏈",
              html: welcomeEmailHtml(origin),
            });
          }
        }
      } catch {
        // Never block login due to email failure
      }
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-error`);
}

function welcomeEmailHtml(origin: string): string {
  const site = origin.includes("localhost") ? "https://talkinflag.com" : origin;
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <tr><td>
      <p style="font-family:Georgia,serif;font-size:28px;font-weight:bold;letter-spacing:4px;text-transform:uppercase;color:#FDDD58;margin:0 0 8px;">TALKIN FLAG</p>
      <p style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#ffffff60;margin:0 0 32px;">The Global Flag Football Hub</p>

      <p style="font-size:16px;line-height:1.6;color:#ffffffcc;margin:0 0 24px;">
        Welcome to Talkin Flag — the global hub for flag football players, coaches, and fans.
      </p>

      <p style="font-size:15px;line-height:1.6;color:#ffffff80;margin:0 0 32px;">
        Here's what you can do right now:
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;">
        <tr><td style="padding:0 0 12px;">
          <a href="${site}/welcome" style="display:block;background:#FDDD58;color:#000000;text-decoration:none;font-size:13px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;padding:14px 20px;text-align:center;">
            Show Me Around →
          </a>
        </td></tr>
        <tr><td style="padding:0 0 12px;">
          <a href="${site}/players" style="display:block;background:transparent;color:#FDDD58;text-decoration:none;font-size:13px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;padding:14px 20px;text-align:center;border:1px solid #FDDD5840;">
            Claim Your Player Profile →
          </a>
        </td></tr>
        <tr><td style="padding:0 0 12px;">
          <a href="${site}/podcast" style="display:block;background:transparent;color:#ffffff80;text-decoration:none;font-size:13px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;padding:14px 20px;text-align:center;border:1px solid #ffffff20;">
            Listen to the Podcast →
          </a>
        </td></tr>
      </table>

      <p style="font-size:12px;color:#ffffff30;margin:32px 0 0;line-height:1.6;">
        You're receiving this because you signed up at talkinflag.com.<br>
        <a href="${site}" style="color:#FDDD5860;text-decoration:none;">talkinflag.com</a>
      </p>
    </td></tr>
  </table>
</body>
</html>`;
}
