import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Admin check
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());
  if (!adminEmails.includes(user.email ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { application_id, action } = await req.json();
  if (!application_id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { data: app } = await supabase
    .from("scout_applications")
    .select("*")
    .eq("id", application_id)
    .single();

  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await supabase
    .from("scout_applications")
    .update({ status: action === "approve" ? "approved" : "rejected", reviewed_at: new Date().toISOString() })
    .eq("id", application_id);

  if (action === "approve" && app.user_id) {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    await admin.from("scouts").upsert({
      user_id: app.user_id,
      application_id: app.id,
      full_name: app.full_name,
      email: app.email,
      location: app.location,
      affiliation: app.affiliation,
    }, { onConflict: "user_id" });
  }

  return NextResponse.json({ ok: true });
}
