import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

const VALID_LEVELS = ["college", "national", "high_school"] as const;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // One application per user
  const { data: existing } = await supabase
    .from("coaches")
    .select("id, status")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "You already have a coach application.", status: existing.status },
      { status: 409 }
    );
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const first_name = String(body.first_name ?? "").trim().slice(0, 100);
  const last_name = String(body.last_name ?? "").trim().slice(0, 100);
  const email = String(body.email ?? "").trim().slice(0, 200);
  const title = String(body.title ?? "").trim().slice(0, 100);
  const team = String(body.team ?? "").trim().slice(0, 200);
  const level = String(body.level ?? "");
  const bio = String(body.bio ?? "").trim().slice(0, 1000);
  const years_coaching = body.years_coaching ? parseInt(String(body.years_coaching)) : null;
  const phone = String(body.phone ?? "").trim().slice(0, 30) || null;
  const website = String(body.website ?? "").trim().slice(0, 200) || null;

  if (!first_name || !last_name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  if (!team) return NextResponse.json({ error: "Team / program name is required" }, { status: 400 });
  if (!VALID_LEVELS.includes(level as typeof VALID_LEVELS[number])) return NextResponse.json({ error: "Invalid level" }, { status: 400 });

  const { error } = await supabase.from("coaches").insert({
    user_id: user.id,
    first_name, last_name, email, title, team, level, bio,
    years_coaching: years_coaching && !isNaN(years_coaching) ? years_coaching : null,
    phone, website,
    status: "pending",
    is_verified: false,
    id_verified: false,
  });

  if (error) {
    console.error("Coach apply error:", error.message);
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }

  // Notify Talkin Flag
  const adminTo = process.env.CONTACT_EMAIL_TO;
  if (adminTo) {
    await sendEmail({
      to: adminTo,
      subject: `[Talkin Flag] New coach application — ${first_name} ${last_name}`,
      replyTo: email,
      html: `
        <div style="font-family:sans-serif;max-width:600px">
          <h2 style="color:#FDDD58">New Coach Application</h2>
          <p><strong>${first_name} ${last_name}</strong> — ${title || "Coach"}</p>
          <p><strong>Team:</strong> ${team}</p>
          <p><strong>Level:</strong> ${level}</p>
          <p><strong>Email:</strong> ${email}</p>
          ${years_coaching ? `<p><strong>Years coaching:</strong> ${years_coaching}</p>` : ""}
          ${bio ? `<p><strong>Bio:</strong><br/>${bio}</p>` : ""}
          <hr style="border:1px solid #222;margin:16px 0"/>
          <p style="color:#999;font-size:12px">Talkin Flag coach application</p>
        </div>
      `,
    });
  }

  // Confirmation to applicant
  await sendEmail({
    to: email,
    subject: "Your Talkin Flag coach application was received",
    html: `
      <div style="font-family:sans-serif;max-width:600px">
        <h2 style="color:#FDDD58">Application Received</h2>
        <p>Hi ${first_name},</p>
        <p>We've received your coach application for <strong>${team}</strong> and will review it shortly.</p>
        <p>Once approved you'll receive a verified coach badge on Talkin Flag, letting you sign off on player stat verifications.</p>
        <p>— Ambra &amp; Tika, Talkin Flag</p>
      </div>
    `,
  });

  return NextResponse.json({ success: true });
}
