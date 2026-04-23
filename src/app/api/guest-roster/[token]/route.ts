import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function findCT(token: string) {
  return prisma.competitionTeam.findUnique({
    where: { rosterToken: token },
    include: {
      competition: { select: { name: true } },
      guestPlayers: { orderBy: { number: "asc" } },
    },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const ct = await findCT(token);
  if (!ct) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    teamName: ct.guestName ?? "?",
    competitionName: ct.competition.name,
    players: ct.guestPlayers,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const ct = await findCT(token);
  if (!ct) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, number } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const player = await prisma.guestPlayer.create({
    data: {
      competitionTeamId: ct.id,
      name: name.trim(),
      number: number ? Number(number) : null,
    },
  });
  return NextResponse.json(player, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const ct = await findCT(token);
  if (!ct) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { playerId } = await req.json();
  const player = await prisma.guestPlayer.findFirst({
    where: { id: playerId, competitionTeamId: ct.id },
  });
  if (!player) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.guestPlayer.delete({ where: { id: playerId } });
  return new NextResponse(null, { status: 204 });
}
