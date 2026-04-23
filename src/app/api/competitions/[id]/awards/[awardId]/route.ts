import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageCompetition } from "@/lib/competition-auth";

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string; awardId: string }> },
) {
  const { id, awardId } = await params;
  const session = await auth();
  if (!await canManageCompetition(session, id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.competitionAward.delete({ where: { id: awardId } });
  return NextResponse.json({ ok: true });
}
