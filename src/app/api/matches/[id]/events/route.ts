import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageMatch, canControlByToken } from "@/lib/competition-auth";
import { getEngine, parseSportConfig } from "@/lib/engines/registry";

// POST — add event (goal, card, period change)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  const body = await request.json();
  const { token, type, teamSide, minute, addedTime, playerName, player2Name } = body;

  const allowed =
    (await canManageMatch(session, id)) ||
    (token && await canControlByToken(id, token));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!type || !teamSide) {
    return NextResponse.json({ error: "TYPE_AND_SIDE_REQUIRED" }, { status: 400 });
  }

  const event = await prisma.matchEvent.create({
    data: {
      matchId: id,
      type,
      teamSide,
      minute: minute !== undefined ? Number(minute) : null,
      addedTime: addedTime !== undefined ? Number(addedTime) : null,
      playerName: playerName?.trim() || null,
      player2Name: player2Name?.trim() || null,
    },
  });

  // Recalculate scores from events
  await recalcScores(id);

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
      events: { orderBy: { createdAt: "asc" } },
      competition: { select: { name: true } },
    },
  });

  return NextResponse.json({ event, match });
}

// PATCH — edit a specific event
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  const allowed = await canManageMatch(session, id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { eventId, type, teamSide, minute, addedTime, playerName, player2Name } = body;
  if (!eventId) return NextResponse.json({ error: "EVENT_ID_REQUIRED" }, { status: 400 });

  await prisma.matchEvent.update({
    where: { id: eventId, matchId: id },
    data: {
      type,
      teamSide,
      minute: minute !== undefined ? (minute === "" || minute === null ? null : Number(minute)) : undefined,
      addedTime: addedTime !== undefined ? (addedTime === "" || addedTime === null ? null : Number(addedTime)) : undefined,
      playerName: playerName !== undefined ? (playerName?.trim() || null) : undefined,
      player2Name: player2Name !== undefined ? (player2Name?.trim() || null) : undefined,
    },
  });

  await recalcScores(id);

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
      events: { orderBy: { createdAt: "asc" } },
      competition: { select: { name: true } },
    },
  });

  return NextResponse.json({ match });
}

// DELETE — undo last event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  const body = await request.json().catch(() => ({}));
  const { token, eventId } = body;

  const allowed =
    (await canManageMatch(session, id)) ||
    (token && await canControlByToken(id, token));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let deletedEvent = null;
  if (eventId) {
    deletedEvent = await prisma.matchEvent.delete({ where: { id: eventId, matchId: id } });
  } else {
    // Undo last event
    const last = await prisma.matchEvent.findFirst({
      where: { matchId: id },
      orderBy: { createdAt: "desc" },
    });
    if (last) deletedEvent = await prisma.matchEvent.delete({ where: { id: last.id } });
  }

  await recalcScores(id);

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
      events: { orderBy: { createdAt: "asc" } },
      competition: { select: { name: true } },
    },
  });

  return NextResponse.json({ match, deletedEvent });
}

async function recalcScores(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      competition: {
        select: {
          sport: {
            select: {
              config: true,
              eventTypes: {
                select: { name: true, labelCs: true, labelEn: true, value: true, affectsScore: true, color: true, icon: true, sortOrder: true },
              },
            },
          },
        },
      },
    },
  });

  const sport = match?.competition?.sport;
  const config = parseSportConfig(sport?.config);
  const engine = getEngine(config.engine);
  const eventTypes = sport?.eventTypes ?? [];

  const events = await prisma.matchEvent.findMany({ where: { matchId } });

  const { homeScore, awayScore } = engine.recalcScores(events, eventTypes);

  await prisma.match.update({
    where: { id: matchId },
    data: { homeScore, awayScore },
  });
}
