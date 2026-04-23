import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sports = await prisma.sport.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { teams: true } } },
  });

  return NextResponse.json(sports);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMINISTRATOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, icon } = await request.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "NAME_REQUIRED" }, { status: 400 });
  }

  const existing = await prisma.sport.findUnique({ where: { name: name.trim() } });
  if (existing) {
    return NextResponse.json({ error: "NAME_EXISTS" }, { status: 409 });
  }

  const sport = await prisma.sport.create({
    data: {
      name: name.trim(),
      icon: icon?.trim() || null,
    },
  });

  return NextResponse.json(sport, { status: 201 });
}
