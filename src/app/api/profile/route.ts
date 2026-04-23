import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { type } = body;

  if (type === "name") {
    const { name } = body;
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { name: name?.trim() || null },
      select: { id: true, name: true, email: true },
    });
    return NextResponse.json(updated);
  }

  if (type === "password") {
    const { currentPassword, newPassword } = body;

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: "PASSWORD_TOO_SHORT" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user?.password) {
      return NextResponse.json({ error: "NO_PASSWORD" }, { status: 400 });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return NextResponse.json({ error: "WRONG_PASSWORD" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashed },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "INVALID_TYPE" }, { status: 400 });
}
