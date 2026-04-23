import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.user.role === "ADMINISTRATOR";

  const teams = await prisma.team.findMany({
    where: isAdmin ? undefined : { ownerId: session.user.id },
    include: { owner: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(teams);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description, logoUrl, sportId } = await request.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "NAME_REQUIRED" }, { status: 400 });
  }

  const team = await prisma.team.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      logoUrl: logoUrl?.trim() || null,
      sportId: sportId || null,
      ownerId: session.user.id,
    },
    include: { owner: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(team, { status: 201 });
}
