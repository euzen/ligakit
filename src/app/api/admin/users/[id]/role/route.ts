import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma/enums";
import { writeAuditLog } from "@/lib/audit";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session || session.user.role !== "ADMINISTRATOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { role } = await request.json();

  if (!Object.values(Role).includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  if (id === session.user.id) {
    return NextResponse.json(
      { error: "Cannot change own role" },
      { status: 400 },
    );
  }

  try {
    const target = await prisma.user.findUnique({ where: { id }, select: { email: true, role: true } });
    await prisma.user.update({ where: { id }, data: { role } });
    await writeAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "ROLE_CHANGE",
      entity: "User",
      entityId: id,
      detail: `${target?.email}: ${target?.role} → ${role}`,
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
