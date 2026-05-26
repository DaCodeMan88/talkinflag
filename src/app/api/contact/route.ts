import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

const VALID_SUBJECTS = [
  "Podcast Feature",
  "Player Submission",
  "Partnership / Sponsorship",
  "Press",
  "Other",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!body.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }
    if (!body.message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const subject = VALID_SUBJECTS.includes(body.subject) ? body.subject : "Other";

    const supabase = createServerClient();
    const { error } = await supabase.from("contact_submissions").insert({
      name: body.name.trim().slice(0, 200),
      email: body.email.trim().slice(0, 200),
      subject,
      message: body.message.trim().slice(0, 2000),
    });

    if (error) {
      console.error("Contact submission error:", error.message);
      return NextResponse.json({ error: "Failed to submit message" }, { status: 500 });
    }

    // TODO: Send email notification — set CONTACT_EMAIL_TO=talkinflagshow@gmail.com in Vercel env vars
    // import { sendEmail } from "@/lib/email";
    // await sendEmail({
    //   to: process.env.CONTACT_EMAIL_TO,
    //   subject: `[Talkin Flag] ${subject} from ${body.name}`,
    //   text: `From: ${body.name} <${body.email}>\n\n${body.message}`,
    // });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
