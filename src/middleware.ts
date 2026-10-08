import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const LEGACY_EVENT_RE =
  /^\/events\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i;

/**
 * /events/<uuid> -> /events/<slug> as a real 308.
 *
 * This cannot live in the page: /events and /events/[id] both have a
 * loading.tsx, so the response is already streaming (status 200) by the time
 * the page runs, and a redirect there degrades to a meta refresh. Google needs
 * the 308 to move the old URL's ranking to the new one.
 *
 * `events` has RLS with no policies, so the lookup uses the service-role key.
 * It runs server-side only and only for old UUID event URLs.
 */
async function legacyEventRedirect(request: NextRequest): Promise<NextResponse | null> {
  const match = request.nextUrl.pathname.match(LEGACY_EVENT_RE);
  if (!match) return null;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/events?id=eq.${match[1]}&is_approved=eq.true&select=slug`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as { slug: string | null }[];
    const slug = rows[0]?.slug;
    if (!slug) return null;
    const url = request.nextUrl.clone();
    url.pathname = `/events/${slug}`;
    return NextResponse.redirect(url, 308);
  } catch {
    // Fall through: the page still redirects (via meta refresh) on its own.
    return null;
  }
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/events/")) {
    return (await legacyEventRedirect(request)) ?? NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect /dashboard routes
  if (request.nextUrl.pathname.startsWith("/dashboard") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard/:path*", "/events/:path*"],
};
