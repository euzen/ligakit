import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "TOKEN_REQUIRED" }, { status: 400 });

  const record = await prisma.lineupToken.findFirst({ where: { matchId: id, token } });
  if (!record) return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 403 });

  const match = await prisma.match.findUnique({
    where: { id },
    select: {
      competitionId: true,
      homeTeamId: true, homeTeamName: true,
      awayTeamId: true, awayTeamName: true,
    },
  });
  if (!match) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const isHome = record.teamSide === "HOME";
  const teamId = isHome ? match.homeTeamId : match.awayTeamId;
  const guestName = isHome ? match.homeTeamName : match.awayTeamName;

  // For guest teams load guest players directly
  let guestPlayers: { id: string; name: string; number: number | null }[] = [];
  let competitionTeamId: string | null = null;
  if (!teamId && guestName) {
    const ct = await prisma.competitionTeam.findFirst({
      where: { competitionId: match.competitionId, guestName },
      include: { guestPlayers: { orderBy: { number: "asc" } } },
    });
    competitionTeamId = ct?.id ?? null;
    guestPlayers = ct?.guestPlayers.map((p) => ({ id: p.id, name: p.name, number: p.number })) ?? [];
  }

  return NextResponse.json({
    side: record.teamSide,
    teamId: teamId ?? null,
    competitionTeamId,
    isGuest: !teamId,
    guestPlayers,
  });
}
