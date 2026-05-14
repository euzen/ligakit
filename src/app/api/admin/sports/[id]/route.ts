import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/admin/sports/[id] - Get sport detail
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
    const sport = await prisma.sport.findUnique({
      where: { id },
      include: {
        eventTypes: {
          orderBy: { sortOrder: "asc" }
        },
        positions: {
          orderBy: { name: "asc" }
        },
        _count: {
          select: { competitions: true, teams: true }
        }
      }
    });

    if (!sport) {
      return NextResponse.json({ error: "Sport not found" }, { status: 404 });
    }

    return NextResponse.json(sport);
  } catch (error) {
    console.error("Failed to fetch sport:", error);
    return NextResponse.json({ error: "Failed to fetch sport" }, { status: 500 });
  }
}

// PATCH /api/admin/sports/[id] - Update sport
export async function PATCH(
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
    const { name, description, icon, config } = body;

    const sport = await prisma.sport.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(config !== undefined && { config }),
      }
    });

    return NextResponse.json(sport);
  } catch (error) {
    console.error("Failed to update sport:", error);
    return NextResponse.json({ error: "Failed to update sport" }, { status: 500 });
  }
}

// DELETE /api/admin/sports/[id] - Delete sport (only if no competitions)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMINISTRATOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Check if sport has competitions
    const sport = await prisma.sport.findUnique({
      where: { id },
      include: { _count: { select: { competitions: true, teams: true } } }
    });

    if (!sport) {
      return NextResponse.json({ error: "Sport not found" }, { status: 404 });
    }

    if (sport._count.competitions > 0 || sport._count.teams > 0) {
      return NextResponse.json(
        { error: "Cannot delete sport with existing competitions or teams" },
        { status: 400 }
      );
    }

    await prisma.sport.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete sport:", error);
    return NextResponse.json({ error: "Failed to delete sport" }, { status: 500 });
  }
}
