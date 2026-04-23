import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function canManageTeam(teamId: string, userId: string, isAdmin: boolean) {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return { ok: false, status: 404, error: "Not found" };
  if (!isAdmin && team.ownerId !== userId) return { ok: false, status: 403, error: "Forbidden" };
  return { ok: true, status: 200, error: null };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; playerId: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: teamId, playerId } = await params;
  const isAdmin = session.user.role === "ADMINISTRATOR";
  const { ok, status, error } = await canManageTeam(teamId, session.user.id, isAdmin);
  if (!ok) return NextResponse.json({ error }, { status });

  const { name, number, positionId } = await request.json();
  if (name !== undefined && !name?.trim()) {
    return NextResponse.json({ error: "NAME_REQUIRED" }, { status: 400 });
  }

  try {
    const updated = await prisma.player.update({
      where: { id: playerId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(number !== undefined && { number: number != null ? Number(number) : null }),
        ...(positionId !== undefined && { positionId: positionId || null }),
      },
      include: { position: { select: { id: true, name: true } } },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; playerId: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: teamId, playerId } = await params;
  const isAdmin = session.user.role === "ADMINISTRATOR";
  const { ok, status, error } = await canManageTeam(teamId, session.user.id, isAdmin);
  if (!ok) return NextResponse.json({ error }, { status });

  try {
    await prisma.player.delete({ where: { id: playerId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
