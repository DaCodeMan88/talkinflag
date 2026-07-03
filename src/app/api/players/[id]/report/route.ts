import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { rateLimit, getClientIp, retryAfterSeconds } from "@/lib/rate-limit";
import { notifyAdmins } from "@/lib/claims";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ip = getClientIp(req);
    const { success, reset } = rateLimit(`report:${ip}`, { limit: 5, windowMs: 60_000 });
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds(reset)) } }
      );
    }

    const body = await req.json();

    // Honeypot: real users never fill this hidden field.
    if (typeof body?.website === "string" && body.website.trim() !== "") {
      return NextResponse.json({ success: true });
    }

    const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : null;
    const reporterEmailRaw = typeof body.reporter_email === "string" ? body.reporter_email.trim().slice(0, 254) : "";
    const reporter_email = reporterEmailRaw && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reporterEmailRaw) ? reporterEmailRaw : null;

    const db = createServerClient();

    const { data: player } = await db
      .from("players")
      .select("id, first_name, last_name")
      .eq("id", id)
      .single();

    if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

    const { error } = await db.from("profile_reports").insert({
      player_id: id,
      reason,
      reporter_email,
    });

    if (error) {
      console.error("Profile report error:", error.message);
      return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
    }

    await notifyAdmins(
      `Profile reported: ${player.first_name} ${player.last_name}`,
      `
        <div style="font-family:sans-serif;max-width:600px">
          <h2 style="color:#FDDD58">Profile Reported</h2>
          <p><strong>${escapeHtml(player.first_name)} ${escapeHtml(player.last_name)}</strong> was flagged by a visitor.</p>
          ${reason ? `<p><strong>Reason:</strong> ${escapeHtml(reason)}</p>` : ""}
          ${reporter_email ? `<p><strong>Reporter:</strong> ${escapeHtml(reporter_email)}</p>` : ""}
          <p><a href="https://talkinflag.com/admin/reports">Review in Admin → Reports</a></p>
        </div>
      `
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
