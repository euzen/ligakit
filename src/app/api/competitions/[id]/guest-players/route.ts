import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const guestName = req.nextUrl.searchParams.get("guestName");
  if (!guestName)
    return NextResponse.json({ error: "GUEST_NAME_REQUIRED" }, { status: 400 });

  const ct = await prisma.competitionTeam.findFirst({
    where: { competitionId: id, guestName },
    include: { guestPlayers: { orderBy: { number: "asc" } } },
  });

  if (!ct) return NextResponse.json([]);

  return NextResponse.json(
    ct.guestPlayers.map((p) => ({
      id: p.id,
      name: p.name,
      number: p.number,
      position: null,
    })),
  );
}
