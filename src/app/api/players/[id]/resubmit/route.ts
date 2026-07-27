import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@/lib/supabase";
import { rateLimit, getClientIp, retryAfterSeconds } from "@/lib/rate-limit";
import { notifyAdmins } from "@/lib/claims";
import { resubmitUpdate } from "@/lib/review/transitions";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(req);
  const { success, reset } = rateLimit(`resubmit:${ip}`, { limit: 5, windowMs: 60_000 });
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds(reset)) } }
    );
  }

  const db = createServerClient();

  const { data: updated, error } = await db
    .from("players")
    .update(resubmitUpdate())
    .eq("id", id)
    .eq("claimed_by", user.id)
    .eq("review_status", "denied")
    .select("id, first_name, last_name")
    .maybeSingle();

  if (error) {
    console.error("Player resubmit error:", error.message);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
  if (!updated) {
    return NextResponse.json(
      { error: "This profile isn't awaiting resubmission." },
      { status: 409 }
    );
  }

  await notifyAdmins(
    `Profile resubmitted for review: ${updated.first_name} ${updated.last_name}`,
    `
      <div style="font-family:sans-serif;max-width:600px">
        <h2 style="color:#FDDD58">Profile Resubmitted</h2>
        <p><strong>${updated.first_name} ${updated.last_name}</strong> updated their profile after a denial and resubmitted it for review.</p>
        <p><a href="https://talkinflag.com/admin/players?filter=pending">Review in Admin → Players → Pending</a></p>
      </div>
    `
  );

  revalidatePath("/players");
  revalidatePath("/dashboard");

  return NextResponse.json({ ok: true });
}
