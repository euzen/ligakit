import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { uploadToCloudinary } from "@/lib/cloudinary";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif", "image/svg+xml"];
const MAX_SIZE = 2 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit(ip, { limit: 30, windowMs: 60 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "TOO_MANY_REQUESTS" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  }

  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "NO_FILE" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "INVALID_TYPE" }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "FILE_TOO_LARGE" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const url = await uploadToCloudinary(bytes, "competitions", file.type);

  return NextResponse.json({ url }, { status: 201 });
}
