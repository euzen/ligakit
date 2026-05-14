import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/admin/sports - List all sports
export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMINISTRATOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sports = await prisma.sport.findMany({
      include: {
        _count: {
          select: { competitions: true, teams: true, eventTypes: true }
        }
      },
      orderBy: { name: "asc" }
    });
    return NextResponse.json(sports);
  } catch (error) {
    console.error("Failed to fetch sports:", error);
    return NextResponse.json({ error: "Failed to fetch sports" }, { status: 500 });
  }
}

// POST /api/admin/sports - Create new sport
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMINISTRATOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, description, icon } = body;

    const sport = await prisma.sport.create({
      data: { name, description, icon }
    });

    return NextResponse.json(sport, { status: 201 });
  } catch (error) {
    console.error("Failed to create sport:", error);
    return NextResponse.json({ error: "Failed to create sport" }, { status: 500 });
  }
}
