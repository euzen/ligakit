import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageMatch } from "@/lib/competition-auth";

// GET — get existing token (organizer/admin only)
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!await canManageMatch(session, id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const token = await prisma.matchRefereeToken.findUnique({ where: { matchId: id } });
  return NextResponse.json(token ?? { token: null });
}

// POST — generate (or regenerate) referee token
export async function POST(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!await canManageMatch(session, id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete existing token if any, then create new one
  await prisma.matchRefereeToken.deleteMany({ where: { matchId: id } });
  const token = await prisma.matchRefereeToken.create({
    data: { matchId: id },
  });

  return NextResponse.json(token);
}

// DELETE — revoke token
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!await canManageMatch(session, id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.matchRefereeToken.deleteMany({ where: { matchId: id } });
  return NextResponse.json({ ok: true });
}
