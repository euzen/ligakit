import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { randomUUID } from "crypto";
import { getUploadDir, getUploadUrl } from "@/lib/upload-path";

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "NO_FILE" }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: "INVALID_TYPE" }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "FILE_TOO_LARGE" }, { status: 400 });

  const ext = extname(file.name) || ".jpg";
  const filename = `${randomUUID()}${ext}`;
  const uploadDir = getUploadDir("avatars");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));

  const imageUrl = getUploadUrl("avatars", filename);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: imageUrl },
  });

  return NextResponse.json({ imageUrl });
}

export async function DELETE() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: null },
  });

  return NextResponse.json({ ok: true });
}
