import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; positionId: string }> },
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMINISTRATOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { positionId } = await params;

  try {
    await prisma.position.delete({ where: { id: positionId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; positionId: string }> },
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMINISTRATOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: sportId, positionId } = await params;
  const { name } = await request.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "NAME_REQUIRED" }, { status: 400 });
  }

  const existing = await prisma.position.findFirst({
    where: { name: name.trim(), sportId, NOT: { id: positionId } },
  });
  if (existing) {
    return NextResponse.json({ error: "NAME_EXISTS" }, { status: 409 });
  }

  try {
    const updated = await prisma.position.update({
      where: { id: positionId },
      data: { name: name.trim() },
      include: { _count: { select: { players: true } } },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
