import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageCompetition } from "@/lib/competition-auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; ctId: string; playerId: string }> },
) {
  const { id, ctId, playerId } = await params;
  const session = await auth();
  if (!await canManageCompetition(session, id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const player = await prisma.guestPlayer.findFirst({
    where: { id: playerId, competitionTeamId: ctId },
  });
  if (!player) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.guestPlayer.delete({ where: { id: playerId } });
  return new NextResponse(null, { status: 204 });
}
