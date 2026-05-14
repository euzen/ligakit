import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; posId: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMINISTRATOR")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { posId } = await params;
  const { name, labelCs, labelEn } = await req.json();
  if (!name?.trim())
    return NextResponse.json({ error: "NAME_REQUIRED" }, { status: 400 });
  try {
    const position = await prisma.position.update({
      where: { id: posId },
      data: {
        name: name.trim(),
        ...(labelCs !== undefined && { labelCs: labelCs.trim() }),
        ...(labelEn !== undefined && { labelEn: labelEn.trim() }),
      },
    });
    return NextResponse.json(position);
  } catch {
    return NextResponse.json({ error: "DUPLICATE_NAME" }, { status: 409 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; posId: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMINISTRATOR")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { posId } = await params;
  await prisma.position.delete({ where: { id: posId } });
  return NextResponse.json({ success: true });
}
