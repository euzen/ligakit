import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function canManageTeam(teamId: string, userId: string, isAdmin: boolean) {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return { ok: false, status: 404, error: "Not found" };
  if (!isAdmin && team.ownerId !== userId) return { ok: false, status: 403, error: "Forbidden" };
  return { ok: true, status: 200, error: null };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: teamId } = await params;
  const isAdmin = session.user.role === "ADMINISTRATOR";
  const { ok, status, error } = await canManageTeam(teamId, session.user.id, isAdmin);
  if (!ok) return NextResponse.json({ error }, { status });

  const players = await prisma.player.findMany({
    where: { teamId },
    orderBy: [{ number: "asc" }, { name: "asc" }],
    include: { position: { select: { id: true, name: true, labelCs: true, labelEn: true } } },
  });
  return NextResponse.json(players);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: teamId } = await params;
  const isAdmin = session.user.role === "ADMINISTRATOR";
  const { ok, status, error } = await canManageTeam(teamId, session.user.id, isAdmin);
  if (!ok) return NextResponse.json({ error }, { status });

  const { name, number, positionId } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: "NAME_REQUIRED" }, { status: 400 });

  const player = await prisma.player.create({
    data: {
      name: name.trim(),
      number: number != null ? Number(number) : null,
      positionId: positionId || null,
      teamId,
    },
    include: { position: { select: { id: true, name: true, labelCs: true, labelEn: true } } },
  });
  return NextResponse.json(player, { status: 201 });
}
