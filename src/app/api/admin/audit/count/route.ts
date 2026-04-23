import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMINISTRATOR") {
    return NextResponse.json({ count: 0 });
  }

  const since = new Date();
  since.setHours(since.getHours() - 24);

  const count = await prisma.auditLog.count({
    where: { createdAt: { gte: since } },
  });

  return NextResponse.json({ count });
}
