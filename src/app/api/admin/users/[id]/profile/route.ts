import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
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
  const body = await request.json();
  const { type } = body;

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, password: true },
  });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (type === "name") {
    const { name } = body;
    const updated = await prisma.user.update({
      where: { id },
      data: { name: name?.trim() || null },
      select: { id: true, name: true, email: true },
    });
    await writeAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "UPDATE",
      entity: "User",
      entityId: id,
      detail: `${target.email}: name → ${name?.trim() || "(cleared)"}`,
    });
    return NextResponse.json(updated);
  }

  if (type === "password") {
    const { newPassword } = body;
    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: "PASSWORD_TOO_SHORT" }, { status: 400 });
    }
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id }, data: { password: hashed } });
    await writeAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "RESET_PASSWORD",
      entity: "User",
      entityId: id,
      detail: target.email,
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "INVALID_TYPE" }, { status: 400 });
}
