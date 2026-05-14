import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageCompetition } from "@/lib/competition-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const posts = await prisma.competitionPost.findMany({
    where: { competitionId: id },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true, email: true } } },
  });
  return NextResponse.json(posts);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!await canManageCompetition(session, id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { body } = await request.json();
  if (!body?.trim()) return NextResponse.json({ error: "BODY_REQUIRED" }, { status: 400 });

  const post = await prisma.competitionPost.create({
    data: { competitionId: id, authorId: session!.user.id, body: body.trim() },
    include: { author: { select: { name: true, email: true } } },
  });
  return NextResponse.json(post, { status: 201 });
}
