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

  const lineup = await prisma.matchPlayer.findMany({
    where: { matchId: id },
    include: {
      player: { select: { id: true, name: true, number: true, position: { select: { id: true, name: true, labelCs: true, labelEn: true } } } },
      guestPlayer: { select: { id: true, name: true, number: true } },
    },
    orderBy: [{ slot: "asc" }, { shirtNumber: "asc" }],
  });

  return NextResponse.json(lineup);
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
    prisma.matchPlayer.createMany({ data: homePlayers.map((p) => toRow(p, "HOME")) }),
    prisma.matchPlayer.createMany({ data: awayPlayers.map((p) => toRow(p, "AWAY")) }),
  ];

  await prisma.$transaction(ops);

  const lineup = await prisma.matchPlayer.findMany({
    where: { matchId: id },
    include: {
      player: { select: { id: true, name: true, number: true, position: { select: { id: true, name: true, labelCs: true, labelEn: true } } } },
      guestPlayer: { select: { id: true, name: true, number: true } },
    },
    orderBy: [{ slot: "asc" }, { shirtNumber: "asc" }],
  });

  return NextResponse.json(lineup);
}
