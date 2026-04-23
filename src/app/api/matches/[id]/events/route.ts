import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageMatch, canControlByToken } from "@/lib/competition-auth";

// POST — add event (goal, card, period change)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  const body = await request.json();
  const { token, type, teamSide, minute, addedTime, playerName } = body;

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

  if (eventId) {
    await prisma.matchEvent.delete({ where: { id: eventId, matchId: id } });
  } else {
    // Undo last event
    const last = await prisma.matchEvent.findFirst({
      where: { matchId: id },
      orderBy: { createdAt: "desc" },
    });
    if (last) await prisma.matchEvent.delete({ where: { id: last.id } });
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

  return NextResponse.json({ match });
}

async function recalcScores(matchId: string) {
  const events = await prisma.matchEvent.findMany({
    where: { matchId, type: { in: ["GOAL", "OWN_GOAL"] } },
  });

  let homeScore = 0;
  let awayScore = 0;
  for (const e of events) {
    if (e.type === "GOAL") {
      if (e.teamSide === "HOME") homeScore++;
      else awayScore++;
    } else if (e.type === "OWN_GOAL") {
      // own goal counts for the opponent
      if (e.teamSide === "HOME") awayScore++;
      else homeScore++;
    }
  }

  await prisma.match.update({
    where: { id: matchId },
    data: { homeScore, awayScore },
  });
}
