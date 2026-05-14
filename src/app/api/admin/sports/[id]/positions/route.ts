import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMINISTRATOR")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const positions = await prisma.position.findMany({
    where: { sportId: id },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(positions);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMINISTRATOR")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { name, labelCs, labelEn } = await req.json();
  if (!name?.trim())
    return NextResponse.json({ error: "NAME_REQUIRED" }, { status: 400 });
  try {
    const position = await prisma.position.create({
      data: {
        sportId: id,
        name: name.trim(),
        labelCs: (labelCs ?? "").trim(),
        labelEn: (labelEn ?? "").trim(),
      },
    });
    return NextResponse.json(position, { status: 201 });
  } catch {
    return NextResponse.json({ error: "DUPLICATE_NAME" }, { status: 409 });
  }
}
