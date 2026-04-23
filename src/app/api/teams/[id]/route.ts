import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

async function getTeamWithAuth(id: string, userId: string, isAdmin: boolean) {
  const team = await prisma.team.findUnique({ where: { id } });
  if (!team) return { team: null, error: "Not found", status: 404 };
  if (!isAdmin && team.ownerId !== userId) {
    return { team: null, error: "Forbidden", status: 403 };
  }
  return { team, error: null, status: 200 };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const isAdmin = session.user.role === "ADMINISTRATOR";
  const { team, error, status } = await getTeamWithAuth(id, session.user.id, isAdmin);
  if (error) return NextResponse.json({ error }, { status });

  const result = await prisma.team.findUnique({
    where: { id },
    include: { owner: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(result);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const isAdmin = session.user.role === "ADMINISTRATOR";
  const { team, error, status } = await getTeamWithAuth(id, session.user.id, isAdmin);
  if (error) return NextResponse.json({ error }, { status });

  const { name, description, logoUrl, sportId } = await request.json();

  if (name !== undefined && !name?.trim()) {
    return NextResponse.json({ error: "NAME_REQUIRED" }, { status: 400 });
  }

  const updated = await prisma.team.update({
    where: { id: team!.id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(logoUrl !== undefined && { logoUrl: logoUrl?.trim() || null }),
      ...(sportId !== undefined && { sportId: sportId || null }),
    },
    include: { owner: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const isAdmin = session.user.role === "ADMINISTRATOR";
  const { team, error, status } = await getTeamWithAuth(id, session.user.id, isAdmin);
  if (error) return NextResponse.json({ error }, { status });

  await prisma.team.delete({ where: { id } });
  await writeAuditLog({
    actorId: session.user.id,
    actorEmail: session.user.email,
    action: "DELETE",
    entity: "Team",
    entityId: id,
    detail: team?.name ?? null,
  });
  return NextResponse.json({ success: true });
}
