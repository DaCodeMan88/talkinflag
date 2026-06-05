import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";

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
    const name = body.name.trim().slice(0, 200);
    const email = body.email.trim().slice(0, 200);
    const message = body.message.trim().slice(0, 2000);

    const supabase = createServerClient();
    const { error } = await supabase.from("contact_submissions").insert({
      name, email, subject, message,
    });

    if (error) {
      console.error("Contact submission error:", error.message);
      return NextResponse.json({ error: "Failed to submit message" }, { status: 500 });
    }

    const to = process.env.CONTACT_EMAIL_TO;
    if (to) {
      await sendEmail({
        to,
        subject: `[Talkin Flag] ${subject} from ${name}`,
        replyTo: email,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#FDDD58;font-family:sans-serif">${subject}</h2>
            <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
            <hr style="border:1px solid #222;margin:16px 0"/>
            <p style="white-space:pre-wrap;color:#333">${message}</p>
            <hr style="border:1px solid #222;margin:16px 0"/>
            <p style="color:#999;font-size:12px">Talkin Flag contact form</p>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
