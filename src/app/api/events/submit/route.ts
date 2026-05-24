import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

const VALID_LEVELS = ["youth", "high_school", "college", "pro", "national", "international", "olympics"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Basic validation
    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Event title is required" }, { status: 400 });
    }
    if (!body.start_date) {
      return NextResponse.json({ error: "Start date is required" }, { status: 400 });
    }

    // Sanitize level
    const level = VALID_LEVELS.includes(body.level) ? body.level : null;

    // Validate website URL if provided
    let websiteUrl: string | null = null;
    if (body.website_url?.trim()) {
      const url = body.website_url.trim();
      if (url.startsWith("http://") || url.startsWith("https://")) {
        websiteUrl = url;
      }
    }

    const supabase = createServerClient();
    const { error } = await supabase.from("events").insert({
      title: body.title.trim().slice(0, 200),
      description: body.description?.trim().slice(0, 1000) || null,
      start_date: body.start_date,
      end_date: body.end_date || null,
      city: body.city?.trim().slice(0, 100) || null,
      country: body.country?.trim().slice(0, 100) || null,
      country_code: body.country_code?.trim().slice(0, 2).toUpperCase() || null,
      level,
      event_type: body.event_type?.trim().slice(0, 100) || null,
      website_url: websiteUrl,
      is_featured: false, // Submitted events are not featured until reviewed
    });

    if (error) {
      console.error("Event submission error:", error.message);
      return NextResponse.json({ error: "Failed to submit event" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
