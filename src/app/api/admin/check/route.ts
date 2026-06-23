import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";

// Lightweight endpoint the client Nav uses to decide whether to show the
// Admin link. Returns { isAdmin } based on the session + ADMIN_EMAILS.
export async function GET() {
  const user = await getAdminUser();
  return NextResponse.json(
    { isAdmin: !!user },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
