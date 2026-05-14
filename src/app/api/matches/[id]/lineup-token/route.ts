import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageMatch } from "@/lib/competition-auth";

// POST — generate or regenerate lineup token for a side
// Body: { side: "HOME" | "AWAY" }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const { id } = await params;

  const allowed = await canManageMatch(session, id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { side } = await req.json();
  if (side !== "HOME" && side !== "AWAY")
    return NextResponse.json({ error: "INVALID_SIDE" }, { status: 400 });

  const existing = await prisma.lineupToken.findUnique({
    where: { matchId_teamSide: { matchId: id, teamSide: side } },
  });

  let record;
  if (existing) {
    record = await prisma.lineupToken.update({
      where: { id: existing.id },
      data: { token: crypto.randomUUID().replace(/-/g, "") },
    });
  } else {
    record = await prisma.lineupToken.create({
      data: { matchId: id, teamSide: side },
    });
  }

  return NextResponse.json({ token: record.token, side: record.teamSide });
}
