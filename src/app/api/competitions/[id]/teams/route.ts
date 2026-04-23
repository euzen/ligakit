import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";

async function getCompetition(competitionId: string) {
  return prisma.competition.findUnique({
    where: { id: competitionId },
    select: { organizerId: true, isPublic: true, maxTeams: true, allowWaitlist: true },
  });
}

async function checkCapacity(competitionId: string, competition: { maxTeams: number | null; allowWaitlist: boolean }) {
  if (!competition.maxTeams) return { isFull: false, isWaitlisted: false };
  const confirmed = await prisma.competitionTeam.count({
    where: { competitionId, isWaitlisted: false },
  });
  if (confirmed >= competition.maxTeams) {
    if (!competition.allowWaitlist) return { isFull: true, isWaitlisted: false };
    return { isFull: false, isWaitlisted: true };
  }
  return { isFull: false, isWaitlisted: false };
}

function isAdmin(session: Session | null) {
  return session?.user.role === "ADMINISTRATOR";
}

function isOrganizer(session: Session | null, organizerId: string) {
  return session?.user.id === organizerId;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const competition = await getCompetition(id);
  if (!competition) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const canManage = isAdmin(session) || isOrganizer(session, competition.organizerId);
  const body = await request.json();

  if (!competition.isPublic) {
    // Private: only organizer/admin can add — by guest name OR by teamId
    if (!canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { guestName, teamId } = body;
    if (!guestName?.trim() && !teamId)
      return NextResponse.json({ error: "NAME_OR_TEAM_REQUIRED" }, { status: 400 });

    if (teamId) {
      const existing = await prisma.competitionTeam.findUnique({
        where: { competitionId_teamId: { competitionId: id, teamId } },
      });
      if (existing) return NextResponse.json({ error: "ALREADY_IN" }, { status: 409 });
    }

    const { isFull, isWaitlisted } = await checkCapacity(id, competition);
    if (isFull) return NextResponse.json({ error: "CAPACITY_FULL" }, { status: 409 });

    const entry = await prisma.competitionTeam.create({
      data: {
        competitionId: id,
        teamId: teamId ?? null,
        guestName: !teamId ? guestName.trim() : null,
        isWaitlisted,
      },
      include: { team: { select: { id: true, name: true, logoUrl: true } } },
    });
    return NextResponse.json(entry, { status: 201 });
  }

  // Public: organizer/admin can add by guestName or teamId; team owner registers their own team
  const { teamId, guestName } = body;

  // Organizer adding a guest team by name
  if (canManage && guestName?.trim() && !teamId) {
    const { isFull, isWaitlisted } = await checkCapacity(id, competition);
    if (isFull) return NextResponse.json({ error: "CAPACITY_FULL" }, { status: 409 });
    const entry = await prisma.competitionTeam.create({
      data: { competitionId: id, teamId: null, guestName: guestName.trim(), isWaitlisted },
      include: { team: { select: { id: true, name: true, logoUrl: true } } },
    });
    return NextResponse.json(entry, { status: 201 });
  }

  if (!teamId) return NextResponse.json({ error: "TEAM_REQUIRED" }, { status: 400 });

  // Non-organizer must own the team
  if (!canManage) {
    const team = await prisma.team.findUnique({ where: { id: teamId }, select: { ownerId: true } });
    if (team?.ownerId !== session.user.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.competitionTeam.findUnique({
    where: { competitionId_teamId: { competitionId: id, teamId } },
  });
  if (existing) return NextResponse.json({ error: "ALREADY_IN" }, { status: 409 });

  const { isFull, isWaitlisted } = await checkCapacity(id, competition);
  if (isFull) return NextResponse.json({ error: "CAPACITY_FULL" }, { status: 409 });

  const entry = await prisma.competitionTeam.create({
    data: { competitionId: id, teamId, guestName: null, isWaitlisted },
    include: { team: { select: { id: true, name: true, logoUrl: true } } },
  });
  return NextResponse.json(entry, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const competition = await getCompetition(id);
  if (!competition) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const canManage = isAdmin(session) || isOrganizer(session, competition.organizerId);

  const body = await request.json();
  const { entryId, teamId } = body;

  if (!canManage) {
    // Team owner can withdraw their own team from public competitions
    if (!competition.isPublic || !teamId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const team = await prisma.team.findUnique({ where: { id: teamId }, select: { ownerId: true } });
    if (team?.ownerId !== session.user.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await prisma.competitionTeam.deleteMany({ where: { competitionId: id, teamId } });
    return NextResponse.json({ ok: true });
  }

  // Organizer/admin: delete by entryId (covers both guest and team entries)
  if (entryId) {
    await prisma.competitionTeam.delete({ where: { id: entryId } });
  } else if (teamId) {
    await prisma.competitionTeam.deleteMany({ where: { competitionId: id, teamId } });
  }
  return NextResponse.json({ ok: true });
}
