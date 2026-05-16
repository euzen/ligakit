import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageCompetition } from "@/lib/competition-auth";
import { computeGroupStandings } from "@/lib/standings";

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
  if (competition?.type !== "TOURNAMENT" && competition?.type !== "CUP") return { filled: false };

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

  // Determine winner and loser
  const winnerIsHome = m.homeScore > m.awayScore;
  const winnerId   = winnerIsHome ? m.homeTeamId   : m.awayTeamId;
  const winnerName = winnerIsHome
    ? (m.homeTeam?.name ?? m.homeTeamName ?? "?")
    : (m.awayTeam?.name ?? m.awayTeamName ?? "?");
  const loserId   = winnerIsHome ? m.awayTeamId   : m.homeTeamId;
  const loserName = winnerIsHome
    ? (m.awayTeam?.name ?? m.awayTeamName ?? "?")
    : (m.homeTeam?.name ?? m.homeTeamName ?? "?");

  const nextRound  = m.round + 1;
  const nextPos    = Math.floor(m.bracketPos / 2);
  const isHomeSlot = m.bracketPos % 2 === 0;

  // Find the next-round match for the winner
  const nextMatch = await prisma.match.findFirst({
    where: { competitionId, round: nextRound, bracketPos: nextPos },
  });

  if (!nextMatch) {
    // This was the final — no next match
    return { filled: false, isFinal: true, winner: winnerName };
  }

  // Update the winner slot
  await prisma.match.update({
    where: { id: nextMatch.id },
    data: isHomeSlot
      ? { homeTeamId: winnerId ?? null, homeTeamName: winnerId ? null : winnerName }
      : { awayTeamId: winnerId ?? null, awayTeamName: winnerId ? null : winnerName },
  });

  // Fill loser into 3rd place match (bracketPos = -1) if it exists
  const thirdMatch = await prisma.match.findFirst({
    where: { competitionId, round: nextRound, bracketPos: -1 },
  });
  if (thirdMatch) {
    await prisma.match.update({
      where: { id: thirdMatch.id },
      data: isHomeSlot
        ? { homeTeamId: loserId ?? null, homeTeamName: loserId ? null : loserName }
        : { awayTeamId: loserId ?? null, awayTeamName: loserId ? null : loserName },
    });
  }

  return { filled: true, nextRound, nextPos, winner: winnerName };
}

/**
 * After every group-stage match in a CUP is PLAYED, check if ALL group matches
 * are done. If so, compute group standings and fill bracket slots with actual teams.
 *
 * Bracket slots were created with placeholder names like "1st A", "2nd B" etc.
 * This function replaces them with real team data.
 */
async function fillCupBracketSlots(competitionId: string): Promise<{ filled: boolean; count?: number }> {
  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
    select: {
      type: true,
      cupAdvancementPreset: true,
      cupTeamsPerGroup: true,
      cupThirdPlaceAdvance: true,
      teams: {
        where: { isWaitlisted: false },
        include: { team: { select: { id: true, name: true, logoUrl: true } } },
      },
      matches: {
        select: {
          id: true, round: true, bracketPos: true, note: true, status: true,
          homeTeamId: true, awayTeamId: true,
          homeTeamName: true, awayTeamName: true,
          homeScore: true, awayScore: true,
          homeTeam: { select: { id: true, name: true, logoUrl: true } },
          awayTeam: { select: { id: true, name: true, logoUrl: true } },
        },
      },
    },
  });

  if (!competition || competition.type !== "CUP") return { filled: false };

  const groupMatches = competition.matches.filter(m => m.note?.startsWith("Skupina"));
  const bracketMatches = competition.matches.filter(m => !m.note?.startsWith("Skupina") && m.bracketPos !== null);

  if (groupMatches.length === 0 || bracketMatches.length === 0) return { filled: false };

  // Check all group matches are played
  const allGroupsDone = groupMatches.every(m => m.status === "PLAYED");
  if (!allGroupsDone) return { filled: false };

  // Check if bracket slots are already filled (not TBD placeholders)
  const firstBracketMatch = bracketMatches[0];
  const alreadyFilled = firstBracketMatch.homeTeamId !== null || 
    (firstBracketMatch.homeTeamName !== null && !firstBracketMatch.homeTeamName?.match(/^(1st|2nd|3rd|Best)\s/));
  if (alreadyFilled) return { filled: false };

  // Compute group standings — must include guest teams (teamId=null)
  // Build synthetic team list from all names appearing in group matches
  const allTeamNames = new Set<string>();
  for (const m of groupMatches) {
    const hId = m.homeTeamId;
    const aId = m.awayTeamId;
    const hName = m.homeTeam?.name ?? m.homeTeamName;
    const aName = m.awayTeam?.name ?? m.awayTeamName;
    if (hName) allTeamNames.add(hId ?? hName);
    if (aName) allTeamNames.add(aId ?? aName);
  }

  // Merge real teams + guest teams into one list for standings
  const systemTeams = competition.teams
    .filter(ct => ct.team !== null)
    .map(ct => ({ team: ct.team! }));
  const systemTeamIds = new Set(systemTeams.map(t => t.team.id));

  // Add synthetic entries for guest teams (those without a real team record)
  const guestTeamEntries = [...allTeamNames]
    .filter(key => !systemTeamIds.has(key))
    .map(name => ({
      team: { id: name, name, logoUrl: null as string | null },
    }));

  const teamsForStandings = [...systemTeams, ...guestTeamEntries];

  const groupStandings = computeGroupStandings(teamsForStandings, groupMatches as Parameters<typeof computeGroupStandings>[1]);

  // Build lookup: placeholder name → real team
  const groupLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const slotMap = new Map<string, { teamId: string | null; teamName: string }>();

  groupStandings.forEach((group, groupIdx) => {
    const letter = groupLabels[groupIdx] ?? `G${groupIdx + 1}`;
    group.rows.forEach((row, pos) => {
      const posLabel = pos === 0 ? "1st" : pos === 1 ? "2nd" : "3rd";
      const placeholder = `${posLabel} ${letter}`;
      // For guest teams, teamId is the name itself — store null for teamId
      const isRealTeam = systemTeamIds.has(row.teamId);
      slotMap.set(placeholder, {
        teamId: isRealTeam ? row.teamId : null,
        teamName: row.teamName,
      });
    });
  });

  // Find first bracket round
  const bracketRounds = [...new Set(bracketMatches.map(m => m.round ?? 0))].sort((a, b) => a - b);
  const firstBracketRound = bracketRounds[0];
  const firstRoundMatches = bracketMatches.filter(m => m.round === firstBracketRound);

  let count = 0;
  for (const m of firstRoundMatches) {
    const homeKey = m.homeTeamName;
    const awayKey = m.awayTeamName;
    const homeReal = homeKey ? slotMap.get(homeKey) : null;
    const awayReal = awayKey ? slotMap.get(awayKey) : null;

    if (homeReal || awayReal) {
      await prisma.match.update({
        where: { id: m.id },
        data: {
          ...(homeReal ? { homeTeamId: homeReal.teamId, homeTeamName: homeReal.teamId ? null : homeReal.teamName } : {}),
          ...(awayReal ? { awayTeamId: awayReal.teamId, awayTeamName: awayReal.teamId ? null : awayReal.teamName } : {}),
        },
      });
      count++;
    }
  }

  return { filled: count > 0, count };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> },
) {
  const { id, matchId } = await params;
  const session = await auth();
  if (!await canManageCompetition(session, id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { homeScore, awayScore, status, scheduledAt, round, note, venue } = await request.json();

  const hasResult = homeScore !== undefined && awayScore !== undefined
    && homeScore !== null && awayScore !== null;

  const effectiveHomeScore = homeScore !== undefined
    ? (homeScore !== null ? Number(homeScore) : null)
    : undefined;
  const effectiveAwayScore = awayScore !== undefined
    ? (awayScore !== null ? Number(awayScore) : null)
    : undefined;

  const isMarkingPlayed = status === "PLAYED";

  // When marking as PLAYED, recalculate score from events if not manually provided
  let finalHomeScore = effectiveHomeScore;
  let finalAwayScore = effectiveAwayScore;

  if (isMarkingPlayed && (effectiveHomeScore === undefined || effectiveHomeScore === null) && (effectiveAwayScore === undefined || effectiveAwayScore === null)) {
    // Recalculate from events
    const [events, sport] = await Promise.all([
      prisma.matchEvent.findMany({ where: { matchId } }),
      prisma.match.findUnique({
        where: { id: matchId },
        select: {
          competition: {
            select: { sport: { select: { eventTypes: { select: { name: true, affectsScore: true } } } } },
          },
        },
      }),
    ]);
    const eventTypes = sport?.competition?.sport?.eventTypes ?? [];
    let calcHome = 0;
    let calcAway = 0;
    for (const e of events) {
      const et = eventTypes.find((t) => t.name === e.type);
      const scores = et?.affectsScore || e.type === "GOAL" || e.type === "OWN_GOAL";
      if (!scores) continue;
      if (e.type === "OWN_GOAL") {
        if (e.teamSide === "HOME") calcAway++; else calcHome++;
      } else {
        if (e.teamSide === "HOME") calcHome++; else calcAway++;
      }
    }
    finalHomeScore = calcHome;
    finalAwayScore = calcAway;
  } else if (isMarkingPlayed) {
    // Manually provided score — keep it, default null to 0
    if (finalHomeScore === null || finalHomeScore === undefined) finalHomeScore = 0;
    if (finalAwayScore === null || finalAwayScore === undefined) finalAwayScore = 0;
  }

  const match = await prisma.match.update({
    where: { id: matchId },
    data: {
      ...(finalHomeScore !== undefined && { homeScore: finalHomeScore }),
      ...(finalAwayScore !== undefined && { awayScore: finalAwayScore }),
      ...(status !== undefined && { status }),
      ...(scheduledAt !== undefined && { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }),
      ...(round !== undefined && { round: round ? Number(round) : null }),
      ...(note !== undefined && { note: note?.trim() || null }),
      ...(venue !== undefined && { venue: venue?.trim() || null }),
      ...((hasResult || isMarkingPlayed) && status === "PLAYED" && { playedAt: new Date() }),
    },
    include: {
      homeTeam: { select: { id: true, name: true, logoUrl: true } },
      awayTeam: { select: { id: true, name: true, logoUrl: true } },
    },
  });

  // Auto-fill bracket slots
  let bracketResult: Record<string, unknown> = { filled: false };
  if (match.status === "PLAYED") {
    // TOURNAMENT: advance winner to next round immediately
    const tournamentResult = await fillBracketSlot(id, matchId);
    if (tournamentResult.filled || "isFinal" in tournamentResult || "drawWarning" in tournamentResult) {
      bracketResult = tournamentResult;
    } else {
      // CUP: fill bracket slots once all group matches are done
      const cupResult = await fillCupBracketSlots(id);
      if (cupResult.filled) {
        bracketResult = { filled: true, cupSlotsFilled: cupResult.count };
      }
    }
  }

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
