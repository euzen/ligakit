import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageCompetition } from "@/lib/competition-auth";

/**
 * Immediately fills the winner of a completed match into the appropriate
 * slot (home or away) of the next-round match, based on bracketPos.
 *
 * Advancement rule (same as generateBracket):
 *   winner at bracketPos p in round r → next-round match at bracketPos floor(p/2)
 *   home slot if p is even, away slot if p is odd
 */
async function fillBracketSlot(
  competitionId: string,
  finishedMatchId: string,
) {
  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
    select: { type: true },
  });
  if (competition?.type !== "TOURNAMENT") return { filled: false };

  const m = await prisma.match.findUnique({
    where: { id: finishedMatchId },
    include: {
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
    },
  });

  if (!m) return { filled: false, reason: "match_not_found" };
  if (m.status !== "PLAYED") return { filled: false, reason: "not_played" };
  if (m.homeScore === null || m.awayScore === null) return { filled: false, reason: "no_score" };
  if (m.round === null) return { filled: false, reason: "no_round" };
  if (m.bracketPos === null) return { filled: false, reason: "no_bracket_pos" };

  // Draw — warn, don't advance
  if (m.homeScore === m.awayScore) {
    const homeName = m.homeTeam?.name ?? m.homeTeamName ?? "?";
    const awayName = m.awayTeam?.name ?? m.awayTeamName ?? "?";
    return { filled: false, drawWarning: `${homeName} vs ${awayName}` };
  }

  // Determine winner
  const winnerIsHome = m.homeScore > m.awayScore;
  const winnerId = winnerIsHome ? m.homeTeamId : m.awayTeamId;
  const winnerName = winnerIsHome
    ? (m.homeTeam?.name ?? m.homeTeamName ?? "?")
    : (m.awayTeam?.name ?? m.awayTeamName ?? "?");

  const nextRound = m.round + 1;
  const nextPos = Math.floor(m.bracketPos / 2);
  const isHomeSlot = m.bracketPos % 2 === 0;

  // Find the next-round match
  const nextMatch = await prisma.match.findFirst({
    where: { competitionId, round: nextRound, bracketPos: nextPos },
  });

  if (!nextMatch) {
    // This was the final — no next match
    return { filled: false, isFinal: true, winner: winnerName };
  }

  // Update the correct slot
  await prisma.match.update({
    where: { id: nextMatch.id },
    data: isHomeSlot
      ? {
          homeTeamId: winnerId ?? null,
          homeTeamName: winnerId ? null : winnerName,
        }
      : {
          awayTeamId: winnerId ?? null,
          awayTeamName: winnerId ? null : winnerName,
        },
  });

  return { filled: true, nextRound, nextPos, winner: winnerName };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> },
) {
  const { id, matchId } = await params;
  const session = await auth();
  if (!await canManageCompetition(session, id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { homeScore, awayScore, status, scheduledAt, round, note } = await request.json();

  const hasResult = homeScore !== undefined && awayScore !== undefined
    && homeScore !== null && awayScore !== null;

  const effectiveHomeScore = homeScore !== undefined
    ? (homeScore !== null ? Number(homeScore) : null)
    : undefined;
  const effectiveAwayScore = awayScore !== undefined
    ? (awayScore !== null ? Number(awayScore) : null)
    : undefined;

  const isMarkingPlayed = status === "PLAYED";
  const existing = isMarkingPlayed
    ? await prisma.match.findUnique({ where: { id: matchId }, select: { homeScore: true, awayScore: true } })
    : null;

  const finalHomeScore = isMarkingPlayed && (effectiveHomeScore === null || (effectiveHomeScore === undefined && existing?.homeScore === null))
    ? 0
    : effectiveHomeScore;
  const finalAwayScore = isMarkingPlayed && (effectiveAwayScore === null || (effectiveAwayScore === undefined && existing?.awayScore === null))
    ? 0
    : effectiveAwayScore;

  const match = await prisma.match.update({
    where: { id: matchId },
    data: {
      ...(finalHomeScore !== undefined && { homeScore: finalHomeScore }),
      ...(finalAwayScore !== undefined && { awayScore: finalAwayScore }),
      ...(status !== undefined && { status }),
      ...(scheduledAt !== undefined && { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }),
      ...(round !== undefined && { round: round ? Number(round) : null }),
      ...(note !== undefined && { note: note?.trim() || null }),
      ...((hasResult || isMarkingPlayed) && status === "PLAYED" && { playedAt: new Date() }),
    },
    include: {
      homeTeam: { select: { id: true, name: true, logoUrl: true } },
      awayTeam: { select: { id: true, name: true, logoUrl: true } },
    },
  });

  // Auto-fill bracket slot for TOURNAMENT whenever match ends up as PLAYED
  const bracketResult = match.status === "PLAYED"
    ? await fillBracketSlot(id, matchId)
    : { filled: false };

  return NextResponse.json({ ...match, bracketResult });
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> },
) {
  const { id, matchId } = await params;
  const session = await auth();
  if (!await canManageCompetition(session, id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.match.delete({ where: { id: matchId } });
  return NextResponse.json({ ok: true });
}
