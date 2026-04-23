import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageCompetition } from "@/lib/competition-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; ctId: string }> },
) {
  const { id, ctId } = await params;
  const session = await auth();
  if (!await canManageCompetition(session, id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ct = await prisma.competitionTeam.findFirst({
    where: { id: ctId, competitionId: id },
    include: { guestPlayers: { orderBy: { number: "asc" } } },
  });
  if (!ct) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(ct.guestPlayers);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; ctId: string }> },
) {
  const { id, ctId } = await params;
  const session = await auth();
  if (!await canManageCompetition(session, id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, number } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const ct = await prisma.competitionTeam.findFirst({ where: { id: ctId, competitionId: id } });
  if (!ct) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const player = await prisma.guestPlayer.create({
    data: {
      competitionTeamId: ctId,
      name: name.trim(),
      number: number ? Number(number) : null,
    },
  });
  return NextResponse.json(player, { status: 201 });
}
