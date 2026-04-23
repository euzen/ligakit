import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageCompetition } from "@/lib/competition-auth";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!await canManageCompetition(session, id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { homeTeamId, awayTeamId, homeTeamName, awayTeamName, scheduledAt, round, note } = await request.json();

  const hasHome = homeTeamId || homeTeamName?.trim();
  const hasAway = awayTeamId || awayTeamName?.trim();
  if (!hasHome || !hasAway)
    return NextResponse.json({ error: "TEAMS_REQUIRED" }, { status: 400 });
  if (homeTeamId && homeTeamId === awayTeamId)
    return NextResponse.json({ error: "SAME_TEAM" }, { status: 400 });

  const match = await prisma.match.create({
    data: {
      competitionId: id,
      homeTeamId: homeTeamId || null,
      awayTeamId: awayTeamId || null,
      homeTeamName: !homeTeamId ? (homeTeamName?.trim() || null) : null,
      awayTeamName: !awayTeamId ? (awayTeamName?.trim() || null) : null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      round: round ? Number(round) : null,
      note: note?.trim() || null,
      status: "SCHEDULED",
    },
    include: {
      homeTeam: { select: { id: true, name: true, logoUrl: true } },
      awayTeam: { select: { id: true, name: true, logoUrl: true } },
    },
  });
  return NextResponse.json(match, { status: 201 });
}
