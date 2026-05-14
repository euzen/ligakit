import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageCompetition } from "@/lib/competition-auth";
import {
  generateRoundRobin,
  generateBerger,
  generateBracket,
  generateCup,
  type DrawSlot,
  type CupAdvancementConfig,
  type CupAdvancementPreset,
} from "@/lib/draw";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
  const { id } = await params;
  const session = await auth();
  if (!await canManageCompetition(session, id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const competition = await prisma.competition.findUnique({
    where: { id },
    select: {
      type: true,
      teams: {
        include: { team: { select: { id: true, name: true } } },
      },
    },
  });

  if (!competition) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const {
    doubleLegs = false,
    numGroups = 2,
    groupDoubleLegs = false,
    clearExisting = false,
    advancementConfig,
    thirdPlaceMatch = false,
    berger = false,
    seedNumbers = {} as Record<string, number>,
  } = body;

  const slots: DrawSlot[] = competition.teams.map((ct) => ({
    teamId: ct.teamId ?? null,
    teamName: ct.team?.name ?? ct.guestName ?? "?",
  }));

  if (slots.length < 2) {
    return NextResponse.json({ error: "NOT_ENOUGH_TEAMS" }, { status: 400 });
  }

  let generatedMatches;

  if (competition.type === "LEAGUE") {
    if (berger) {
      // Sort slots by assigned seed number; unassigned seeds go to the end
      const seeded = [...slots].sort((a, b) => {
        const sa = seedNumbers[a.teamId ?? a.teamName] ?? 999;
        const sb = seedNumbers[b.teamId ?? b.teamName] ?? 999;
        return sa - sb;
      });
      generatedMatches = generateBerger(seeded, { doubleLegs });
    } else {
      generatedMatches = generateRoundRobin(slots, { doubleLegs });
    }
  } else if (competition.type === "TOURNAMENT") {
    generatedMatches = generateBracket(slots, { thirdPlaceMatch });
    await prisma.competition.update({ where: { id }, data: { thirdPlaceMatch } });
  } else if (competition.type === "CUP") {
    const groups = Math.max(2, Math.min(numGroups, Math.floor(slots.length / 2)));

    // Build advancement config with defaults
    const config: CupAdvancementConfig = advancementConfig ?? {
      preset: "WINNERS_ONLY",
      teamsPerGroup: 1,
    };

    generatedMatches = generateCup(slots, groups, {
      groupDoubleLegs,
      advancementConfig: config,
      thirdPlaceMatch,
    });

    // Store config in DB for this competition
    await prisma.competition.update({
      where: { id },
      data: {
        cupAdvancementPreset: config.preset,
        cupTeamsPerGroup: config.teamsPerGroup,
        cupThirdPlaceAdvance: config.thirdPlaceAdvance ?? null,
        cupCustomPairings: config.customPairings ? JSON.stringify(config.customPairings) : null,
        thirdPlaceMatch,
      },
    });
  } else {
    return NextResponse.json({ error: "UNKNOWN_TYPE" }, { status: 400 });
  }

  // Persist: optionally clear existing matches first
  if (clearExisting) {
    await prisma.match.deleteMany({ where: { competitionId: id } });
  }

  const created = await prisma.match.createMany({
    data: generatedMatches.map((m) => ({
      competitionId: id,
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      homeTeamName: m.homeTeamName,
      awayTeamName: m.awayTeamName,
      round: m.round,
      bracketPos: m.bracketPos ?? null,
      note: m.group ? `Skupina ${m.group}` : m.stage ?? null,
      status: "SCHEDULED" as const,
    })),
  });

  return NextResponse.json({ created: created.count, matches: generatedMatches });
  } catch (error) {
    console.error("Draw API error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
