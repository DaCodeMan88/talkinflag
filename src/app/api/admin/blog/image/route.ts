import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/eval/admin-client";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

function extForType(type: string): string {
  return type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
}

export async function POST(req: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "File must be JPG, PNG, or WebP" },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File must be under 5MB" }, { status: 400 });
  }

  const ext = extForType(file.type);
  const path = `posts/${crypto.randomUUID()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const db = createAdminClient();

  const { error: uploadError } = await db.storage
    .from("blog")
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = db.storage.from("blog").getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
