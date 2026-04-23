import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const positions = await prisma.position.findMany({
    where: { sportId: id },
    orderBy: { name: "asc" },
    include: { _count: { select: { players: true } } },
  });
  return NextResponse.json(positions);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMINISTRATOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: sportId } = await params;
  const { name } = await request.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "NAME_REQUIRED" }, { status: 400 });
  }

  const existing = await prisma.position.findUnique({
    where: { name_sportId: { name: name.trim(), sportId } },
  });
  if (existing) {
    return NextResponse.json({ error: "NAME_EXISTS" }, { status: 409 });
  }

  const position = await prisma.position.create({
    data: { name: name.trim(), sportId },
    include: { _count: { select: { players: true } } },
  });
  return NextResponse.json(position, { status: 201 });
}
