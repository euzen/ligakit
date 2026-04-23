import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const competitions = await prisma.competition.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      sport: { select: { id: true, name: true, icon: true } },
      organizer: { select: { id: true, name: true, email: true } },
      _count: { select: { teams: true, matches: true } },
    },
  });
  return NextResponse.json(competitions);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description, type, status, isPublic, sportId, startDate, endDate, periodCount, periodDuration } = await request.json();

  if (!name?.trim()) return NextResponse.json({ error: "NAME_REQUIRED" }, { status: 400 });
  if (!["LEAGUE", "CUP", "TOURNAMENT"].includes(type))
    return NextResponse.json({ error: "INVALID_TYPE" }, { status: 400 });

  const competition = await prisma.competition.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      type,
      status: status ?? "DRAFT",
      isPublic: isPublic !== undefined ? Boolean(isPublic) : true,
      sportId: sportId || null,
      organizerId: session.user.id,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      periodCount: periodCount ? Number(periodCount) : null,
      periodDuration: periodDuration ? Number(periodDuration) : null,
    },
    include: {
      sport: { select: { id: true, name: true, icon: true } },
      _count: { select: { teams: true, matches: true } },
    },
  });

  return NextResponse.json(competition, { status: 201 });
}
