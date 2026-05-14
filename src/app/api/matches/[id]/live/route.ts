import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEngine, parseSportConfig } from "@/lib/engines/registry";

interface RosterPlayer { id: string; name: string; number: number | null; slot: string }

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      homeTeam: { select: { id: true, name: true, logoUrl: true } },
      awayTeam: { select: { id: true, name: true, logoUrl: true } },
      events: { orderBy: { createdAt: "asc" } },
      competition: {
        select: {
          id: true,
          name: true,
          periodCount: true,
          periodDuration: true,
          sport: {
            select: {
              config: true,
              eventTypes: {
                select: { name: true, labelCs: true, labelEn: true, value: true, affectsScore: true, color: true, icon: true, sortOrder: true },
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!match) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const sport = match.competition?.sport;
  const config = parseSportConfig(sport?.config);
  const engine = getEngine(config.engine);
  const eventTypes = engine.getAllowedEventTypes(sport?.eventTypes ?? []);

  // Load nominated lineup; fall back to full roster if no lineup exists
  let homePlayers: RosterPlayer[] = [];
  let awayPlayers: RosterPlayer[] = [];

  const lineup = await prisma.matchPlayer.findMany({
    where: { matchId: id },
    include: {
      player: { select: { id: true, name: true, number: true } },
      guestPlayer: { select: { id: true, name: true, number: true } },
    },
    orderBy: [{ slot: "asc" }, { shirtNumber: "asc" }],
  });

  const homeLineup = lineup.filter((mp) => mp.teamSide === "HOME");
  const awayLineup = lineup.filter((mp) => mp.teamSide === "AWAY");

  if (homeLineup.length > 0) {
    homePlayers = homeLineup
      .map((mp) => {
        const p = mp.player ?? mp.guestPlayer;
        if (!p) return null;
        return { id: p.id, name: p.name, number: mp.shirtNumber ?? p.number, slot: mp.slot as string };
      })
      .filter((p): p is RosterPlayer => p !== null);
  } else if (match.homeTeamId) {
    const ps = await prisma.player.findMany({
      where: { teamId: match.homeTeamId },
      select: { id: true, name: true, number: true },
      orderBy: { number: "asc" },
    });
    homePlayers = ps.map((p) => ({ ...p, slot: "STARTER" }));
  } else if (match.homeTeamName) {
    const ct = await prisma.competitionTeam.findFirst({
      where: { competitionId: match.competitionId, guestName: match.homeTeamName },
      include: { guestPlayers: { orderBy: { number: "asc" } } },
    });
    if (ct) homePlayers = ct.guestPlayers.map((p) => ({ ...p, slot: "STARTER" }));
  }

  if (awayLineup.length > 0) {
    awayPlayers = awayLineup
      .map((mp) => {
        const p = mp.player ?? mp.guestPlayer;
        if (!p) return null;
        return { id: p.id, name: p.name, number: mp.shirtNumber ?? p.number, slot: mp.slot as string };
      })
      .filter((p): p is RosterPlayer => p !== null);
  } else if (match.awayTeamId) {
    const ps = await prisma.player.findMany({
      where: { teamId: match.awayTeamId },
      select: { id: true, name: true, number: true },
      orderBy: { number: "asc" },
    });
    awayPlayers = ps.map((p) => ({ ...p, slot: "STARTER" }));
  } else if (match.awayTeamName) {
    const ct = await prisma.competitionTeam.findFirst({
      where: { competitionId: match.competitionId, guestName: match.awayTeamName },
      include: { guestPlayers: { orderBy: { number: "asc" } } },
    });
    if (ct) awayPlayers = ct.guestPlayers.map((p) => ({ ...p, slot: "STARTER" }));
  }

  return NextResponse.json({ ...match, homePlayers, awayPlayers, eventTypes }, {
    headers: { "Cache-Control": "no-store" },
  });
}
