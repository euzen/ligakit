import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session || session.user.role !== "ADMINISTRATOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json(
      { error: "Cannot delete own account" },
      { status: 400 },
    );
  }

  try {
    const target = await prisma.user.findUnique({ where: { id }, select: { email: true } });
    await prisma.user.delete({ where: { id } });
    await writeAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "DELETE",
      entity: "User",
      entityId: id,
      detail: target?.email ?? null,
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
