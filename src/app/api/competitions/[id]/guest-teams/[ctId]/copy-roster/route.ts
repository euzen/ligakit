import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageCompetition } from "@/lib/competition-auth";

// POST /api/competitions/[id]/guest-teams/[ctId]/copy-roster
// Body: { sourceCtId: string }  — copy guest players from another CompetitionTeam
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; ctId: string }> },
) {
  const { id, ctId } = await params;
  const session = await auth();
  if (!await canManageCompetition(session, id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { sourceCtId } = await req.json();
  if (!sourceCtId) return NextResponse.json({ error: "sourceCtId required" }, { status: 400 });

  const target = await prisma.competitionTeam.findFirst({ where: { id: ctId, competitionId: id } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const source = await prisma.competitionTeam.findFirst({
    where: { id: sourceCtId },
    include: { guestPlayers: true },
  });
  if (!source) return NextResponse.json({ error: "Source not found" }, { status: 404 });

  const created = await prisma.$transaction(
    source.guestPlayers.map((p) =>
      prisma.guestPlayer.create({
        data: { competitionTeamId: ctId, name: p.name, number: p.number },
      }),
    ),
  );

  return NextResponse.json({ copied: created.length }, { status: 201 });
}
