import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function canManageTeam(teamId: string, userId: string, isAdmin: boolean) {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return { ok: false, status: 404, error: "Not found" };
  if (!isAdmin && team.ownerId !== userId) return { ok: false, status: 403, error: "Forbidden" };
  return { ok: true, status: 200, error: null };
}

// POST /api/teams/[id]/players/import
// Body: { players: { name: string; number?: number | null }[] }
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

  const { players } = await request.json();
  if (!Array.isArray(players) || players.length === 0) {
    return NextResponse.json({ error: "EMPTY" }, { status: 400 });
  }

  const rows = players
    .map((p: { name?: string; number?: number | null }) => ({
      name: p.name?.trim() ?? "",
      number: p.number != null ? Number(p.number) : null,
    }))
    .filter((p) => p.name.length > 0);

  if (rows.length === 0) {
    return NextResponse.json({ error: "NO_VALID_ROWS" }, { status: 400 });
  }

  const created = await prisma.$transaction(
    rows.map((p) =>
      prisma.player.create({
        data: { name: p.name, number: p.number, teamId },
      }),
    ),
  );

  return NextResponse.json({ created: created.length }, { status: 201 });
}
