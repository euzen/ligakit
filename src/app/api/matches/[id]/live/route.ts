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
    select: {
      id: true,
      homeScore: true,
      awayScore: true,
      matchState: true,
      period: true,
      startedAt: true,
      periodOffset: true,
      homeTeamId: true,
      awayTeamId: true,
      homeTeamName: true,
      awayTeamName: true,
      competitionId: true,
      homeFormation: true,
      awayFormation: true,
      homeLineupPositions: true,
      awayLineupPositions: true,
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

  // Calculate score dynamically from events
  // OWN_GOAL: scored by team X → counts for the OTHER team
  let homeScore = 0;
  let awayScore = 0;
  for (const e of match.events) {
    const et = match.competition?.sport?.eventTypes?.find((t) => t.name === e.type);
    const scores = et?.affectsScore || e.type === "OWN_GOAL" || e.type === "GOAL";
    if (!scores) continue;
    const isOwnGoal = e.type === "OWN_GOAL";
    if (isOwnGoal) {
      // Own goal counts for the opposing team
      if (e.teamSide === "HOME") awayScore++;
      else homeScore++;
    } else {
      if (e.teamSide === "HOME") homeScore++;
      else awayScore++;
    }
  }

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

  // Apply SUBSTITUTION events to update player slots
  const applySubstitutions = (players: RosterPlayer[], side: "HOME" | "AWAY") => {
    const subs = match.events.filter((e) => e.type === "SUBSTITUTION" && e.teamSide === side);
    if (subs.length === 0) return players;
    let result = [...players];
    for (const ev of subs) {
      const outName = ev.playerName;
      const inName  = ev.player2Name;
      if (!outName || !inName) continue;
      result = result.map((p) => {
        if (p.name === outName) return { ...p, slot: "SUBSTITUTE" };
        if (p.name === inName)  return { ...p, slot: "STARTER" };
        return p;
      });
    }
    return result;
  };

  homePlayers = applySubstitutions(homePlayers, "HOME");
  awayPlayers = applySubstitutions(awayPlayers, "AWAY");

  // Get formations and positions from match
  const formations = {
    home: match.homeFormation ?? null,
    away: match.awayFormation ?? null,
  };
  
  const enrichPositions = (positions: Array<{playerId?: string; guestPlayerId?: string; positionIndex: number}> | null, players: RosterPlayer[]) => {
    if (!positions) return [];
    const playerMap = new Map(players.map(p => [p.id, p]));
    return positions.map((p) => {
      const playerId = p.playerId ?? p.guestPlayerId;
      const player = playerId ? playerMap.get(playerId) : null;
      return {
        ...p,
        name: player?.name ?? "",
        number: player?.number ?? null,
      };
    });
  };

  const positions = {
    home: enrichPositions(match.homeLineupPositions as Array<{playerId?: string; guestPlayerId?: string; positionIndex: number}>, homePlayers),
    away: enrichPositions(match.awayLineupPositions as Array<{playerId?: string; guestPlayerId?: string; positionIndex: number}>, awayPlayers),
  };

  return NextResponse.json({ 
    ...match, 
    homeScore, 
    awayScore, 
    homePlayers, 
    awayPlayers, 
    eventTypes, 
    formations, 
    positions 
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
