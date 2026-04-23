import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageMatch, canControlByToken } from "@/lib/competition-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  const body = await request.json();
  const { token, matchState, period, endPeriod } = body;

  const allowed =
    (await canManageMatch(session, id)) ||
    (token && await canControlByToken(id, token));

  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const data: Record<string, unknown> = {};

  if (matchState !== undefined) {
    data.matchState = matchState;
    if (matchState === "LIVE") {
      data.startedAt = new Date();
      if (period === 1) {
        data.periodOffset = 0;
      }
    }
    if (matchState === "FINISHED") {
      data.status = "PLAYED";
      const current = await prisma.match.findUnique({ where: { id }, select: { homeScore: true, awayScore: true } });
      if (current?.homeScore === null) data.homeScore = 0;
      if (current?.awayScore === null) data.awayScore = 0;
    }
  }
  if (period !== undefined) data.period = period;
  if (endPeriod) {
    const current = await prisma.match.findUnique({ where: { id }, select: { startedAt: true, periodOffset: true } });
    const elapsedSeconds = current?.startedAt
      ? Math.floor((Date.now() - new Date(current.startedAt).getTime()) / 1000)
      : 0;
    const currentOffset = current?.periodOffset ?? 0;
    data.matchState = "PAUSED";
    data.startedAt = null;
    data.periodOffset = currentOffset + elapsedSeconds;
  }

  const match = await prisma.match.update({
    where: { id },
    data,
    include: {
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
      events: { orderBy: { createdAt: "asc" } },
      competition: { select: { name: true } },
    },
  });

  return NextResponse.json(match);
}
