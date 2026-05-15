import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageMatch } from "@/lib/competition-auth";

async function resolveTokenSide(matchId: string, token: string | null): Promise<string | null> {
  if (!token) return null;
  const record = await prisma.lineupToken.findFirst({ where: { matchId, token } });
  return record?.teamSide ?? null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = req.nextUrl.searchParams.get("token");
  const tokenSide = await resolveTokenSide(id, token);
  const session = await auth();
  const isManager = await canManageMatch(session, id);
  if (!isManager && !tokenSide)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [lineup, match] = await Promise.all([
    prisma.matchPlayer.findMany({
      where: { matchId: id },
      include: {
        player: { select: { id: true, name: true, number: true, position: { select: { id: true, name: true, labelCs: true, labelEn: true } } } },
        guestPlayer: { select: { id: true, name: true, number: true } },
      },
      orderBy: [{ slot: "asc" }, { shirtNumber: "asc" }],
    }),
    prisma.match.findUnique({
      where: { id },
      select: {
        homeFormation: true,
        awayFormation: true,
        homeLineupPositions: true,
        awayLineupPositions: true,
      },
    }),
  ]);

  // Build player lookup map for enriching positions
  const playerMap = new Map<string, { name: string; number: number | null }>();
  for (const mp of lineup) {
    if (mp.player) {
      playerMap.set(mp.player.id, { name: mp.player.name, number: mp.player.number });
    }
    if (mp.guestPlayer) {
      playerMap.set(mp.guestPlayer.id, { name: mp.guestPlayer.name, number: mp.guestPlayer.number });
    }
  }

  // Enrich positions with player names
  const enrichPositions = (positions: Array<{playerId?: string; guestPlayerId?: string; positionIndex: number}> | null) => {
    if (!positions) return [];
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

  return NextResponse.json({
    players: lineup,
    formations: {
      home: match?.homeFormation ?? null,
      away: match?.awayFormation ?? null,
    },
    positions: {
      home: enrichPositions(match?.homeLineupPositions as Array<{playerId?: string; guestPlayerId?: string; positionIndex: number}>),
      away: enrichPositions(match?.awayLineupPositions as Array<{playerId?: string; guestPlayerId?: string; positionIndex: number}>),
    },
  });
}

// PUT — replaces full lineup for one side (or both)
// Body: { token?: string, home: [{playerId, slot, shirtNumber}], away: [...] }
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const { id } = await params;
  const body = await req.json();
  const { token: bodyToken } = body;

  const tokenSide = await resolveTokenSide(id, bodyToken ?? null);
  const isManager = await canManageMatch(session, id);
  if (!isManager && !tokenSide)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Block changes when match is started
  const match = await prisma.match.findUnique({
    where: { id },
    select: { matchState: true, homeTeamId: true, awayTeamId: true },
  });
  if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (match.matchState === "LIVE" || match.matchState === "FINISHED") {
    return NextResponse.json({ error: "MATCH_ALREADY_STARTED" }, { status: 409 });
  }

  // { playerId?, guestPlayerId?, slot, shirtNumber? }
  type LineupInput = { playerId?: string; guestPlayerId?: string; slot: string; shirtNumber?: number | null }[];

  const sides: Array<"HOME" | "AWAY"> = tokenSide
    ? [tokenSide as "HOME" | "AWAY"]
    : ["HOME", "AWAY"];

  const homePlayers: LineupInput = sides.includes("HOME") ? (body.home ?? []) : [];
  const awayPlayers: LineupInput = sides.includes("AWAY") ? (body.away ?? []) : [];

  const toRow = (p: LineupInput[number], side: "HOME" | "AWAY") => ({
    matchId: id,
    playerId: p.playerId ?? null,
    guestPlayerId: p.guestPlayerId ?? null,
    teamSide: side,
    slot: (p.slot === "SUBSTITUTE" ? "SUBSTITUTE" : "STARTER") as "STARTER" | "SUBSTITUTE",
    shirtNumber: p.shirtNumber ?? null,
  });

  const ops = [
    ...sides.map((side) =>
      prisma.matchPlayer.deleteMany({ where: { matchId: id, teamSide: side } })
    ),
  ];

  // Only add createMany if there are players to create
  if (homePlayers.length > 0) {
    ops.push(prisma.matchPlayer.createMany({ data: homePlayers.map((p) => toRow(p, "HOME")) }));
  }
  if (awayPlayers.length > 0) {
    ops.push(prisma.matchPlayer.createMany({ data: awayPlayers.map((p) => toRow(p, "AWAY")) }));
  }

  // Run lineup changes in transaction (or directly if no ops)
  if (ops.length > 0) {
    await prisma.$transaction(ops);
  }

  // Update formations separately (outside transaction to avoid type issues)
  if (body.homeFormation !== undefined || body.awayFormation !== undefined ||
      body.homePositions !== undefined || body.awayPositions !== undefined) {
    const updateData: Record<string, unknown> = {};
    if (body.homeFormation !== undefined) updateData.homeFormation = body.homeFormation || null;
    if (body.awayFormation !== undefined) updateData.awayFormation = body.awayFormation || null;
    if (body.homePositions !== undefined) updateData.homeLineupPositions = body.homePositions || null;
    if (body.awayPositions !== undefined) updateData.awayLineupPositions = body.awayPositions || null;
    
    await prisma.match.update({ where: { id }, data: updateData });
  }

  const [updatedLineup, updatedMatch] = await Promise.all([
    prisma.matchPlayer.findMany({
      where: { matchId: id },
      include: {
        player: { select: { id: true, name: true, number: true, position: { select: { id: true, name: true, labelCs: true, labelEn: true } } } },
        guestPlayer: { select: { id: true, name: true, number: true } },
      },
      orderBy: [{ slot: "asc" }, { shirtNumber: "asc" }],
    }),
    prisma.match.findUnique({
      where: { id },
      select: {
        homeFormation: true,
        awayFormation: true,
        homeLineupPositions: true,
        awayLineupPositions: true,
      },
    }),
  ]);

  // Build player lookup map for enriching positions
  const playerMap = new Map<string, { name: string; number: number | null }>();
  for (const mp of updatedLineup) {
    if (mp.player) {
      playerMap.set(mp.player.id, { name: mp.player.name, number: mp.player.number });
    }
    if (mp.guestPlayer) {
      playerMap.set(mp.guestPlayer.id, { name: mp.guestPlayer.name, number: mp.guestPlayer.number });
    }
  }

  // Enrich positions with player names
  const enrichPositions = (positions: Array<{playerId?: string; guestPlayerId?: string; positionIndex: number}> | null) => {
    if (!positions) return [];
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

  return NextResponse.json({
    players: updatedLineup,
    formations: {
      home: updatedMatch?.homeFormation ?? null,
      away: updatedMatch?.awayFormation ?? null,
    },
    positions: {
      home: enrichPositions(updatedMatch?.homeLineupPositions as Array<{playerId?: string; guestPlayerId?: string; positionIndex: number}>),
      away: enrichPositions(updatedMatch?.awayLineupPositions as Array<{playerId?: string; guestPlayerId?: string; positionIndex: number}>),
    },
  });
}
