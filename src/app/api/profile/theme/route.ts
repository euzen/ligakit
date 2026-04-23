import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { theme } = await request.json();
  if (!["light", "dark", "system"].includes(theme)) {
    return NextResponse.json({ error: "INVALID_THEME" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { theme },
  });

  return NextResponse.json({ theme });
}
