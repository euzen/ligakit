import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RosterPlayer { id: string; name: string; number: number | null }

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
      events: { orderBy: { createdAt: "asc" } },
      competition: { select: { name: true, periodCount: true, periodDuration: true } },
    },
  });

  if (!match) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  // Load rosters
  let homePlayers: RosterPlayer[] = [];
  let awayPlayers: RosterPlayer[] = [];

  if (match.homeTeamId) {
    homePlayers = await prisma.player.findMany({
      where: { teamId: match.homeTeamId },
      select: { id: true, name: true, number: true },
      orderBy: { number: "asc" },
    });
  } else if (match.homeTeamName) {
    // Guest team — find CompetitionTeam by guestName
    const ct = await prisma.competitionTeam.findFirst({
      where: { competitionId: match.competitionId, guestName: match.homeTeamName },
      include: { guestPlayers: { orderBy: { number: "asc" } } },
    });
    if (ct) homePlayers = ct.guestPlayers;
  }

  if (match.awayTeamId) {
    awayPlayers = await prisma.player.findMany({
      where: { teamId: match.awayTeamId },
      select: { id: true, name: true, number: true },
      orderBy: { number: "asc" },
    });
  } else if (match.awayTeamName) {
    const ct = await prisma.competitionTeam.findFirst({
      where: { competitionId: match.competitionId, guestName: match.awayTeamName },
      include: { guestPlayers: { orderBy: { number: "asc" } } },
    });
    if (ct) awayPlayers = ct.guestPlayers;
  }

  return NextResponse.json({ ...match, homePlayers, awayPlayers }, {
    headers: { "Cache-Control": "no-store" },
  });
}
