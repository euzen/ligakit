import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/admin/sports/[id]/event-types - List event types for sport
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMINISTRATOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const eventTypes = await prisma.eventType.findMany({
      where: { sportId: id },
      orderBy: { sortOrder: "asc" }
    });
    return NextResponse.json(eventTypes);
  } catch (error) {
    console.error("Failed to fetch event types:", error);
    return NextResponse.json({ error: "Failed to fetch event types" }, { status: 500 });
  }
}

// POST /api/admin/sports/[id]/event-types - Create event type
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMINISTRATOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { name, labelCs, labelEn, icon, color, value, affectsScore, sortOrder } = body;

    const eventType = await prisma.eventType.create({
      data: {
        sportId: id,
        name,
        labelCs,
        labelEn,
        icon,
        color,
        value,
        affectsScore: affectsScore ?? true,
        sortOrder: sortOrder ?? 0
      }
    });

    return NextResponse.json(eventType, { status: 201 });
  } catch (error) {
    console.error("Failed to create event type:", error);
    return NextResponse.json({ error: "Failed to create event type" }, { status: 500 });
  }
}
