import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageCompetition } from "@/lib/competition-auth";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const competition = await prisma.competition.findUnique({
    where: { id },
    include: {
      sport: { select: { id: true, name: true, icon: true } },
      organizer: { select: { id: true, name: true, email: true } },
      teams: {
        orderBy: { joinedAt: "asc" },
        include: { team: { select: { id: true, name: true, logoUrl: true } } },
      },
      matches: {
        orderBy: [{ round: "asc" }, { scheduledAt: "asc" }],
        include: {
          homeTeam: { select: { id: true, name: true, logoUrl: true } },
          awayTeam: { select: { id: true, name: true, logoUrl: true } },
        },
      },
    },
  });
  if (!competition) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json(competition);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!await canManageCompetition(session, id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, description, type, status, isPublic, sportId, startDate, endDate, periodCount, periodDuration, maxTeams, allowWaitlist, logoUrl } = await request.json();
  if (name !== undefined && !name?.trim()) return NextResponse.json({ error: "NAME_REQUIRED" }, { status: 400 });

  const competition = await prisma.competition.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(type !== undefined && { type }),
      ...(status !== undefined && { status }),
      ...(isPublic !== undefined && { isPublic: Boolean(isPublic) }),
      ...(sportId !== undefined && { sportId: sportId || null }),
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      ...(periodCount !== undefined && { periodCount: periodCount ? Number(periodCount) : null }),
      ...(periodDuration !== undefined && { periodDuration: periodDuration ? Number(periodDuration) : null }),
      ...(maxTeams !== undefined && { maxTeams: maxTeams ? Number(maxTeams) : null }),
      ...(allowWaitlist !== undefined && { allowWaitlist: Boolean(allowWaitlist) }),
      ...(logoUrl !== undefined && { logoUrl: logoUrl || null }),
    },
  });
  return NextResponse.json(competition);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!await canManageCompetition(session, id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.competition.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
