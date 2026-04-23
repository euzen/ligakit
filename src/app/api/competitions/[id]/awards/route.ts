import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageCompetition } from "@/lib/competition-auth";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const awards = await prisma.competitionAward.findMany({
    where: { competitionId: id },
    include: { player: { select: { id: true, name: true, number: true } } },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(awards);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!await canManageCompetition(session, id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  console.log("[awards POST] body:", JSON.stringify(body));
  const { title, recipientName, icon, playerId, sortOrder } = body;
  if (!title?.trim() || !recipientName?.trim()) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }

  try {
    const award = await prisma.competitionAward.create({
      data: {
        competitionId: id,
        title: title.trim(),
        recipientName: recipientName.trim(),
        icon: icon ?? null,
        playerId: playerId ?? null,
        sortOrder: sortOrder ?? 0,
      },
      include: { player: { select: { id: true, name: true, number: true } } },
    });
    return NextResponse.json(award);
  } catch (e) {
    console.error("[awards POST]", e);
    return NextResponse.json({ error: "DB_ERROR", detail: String(e) }, { status: 500 });
  }
}
