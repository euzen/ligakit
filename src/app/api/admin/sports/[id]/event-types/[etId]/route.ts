import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; etId: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMINISTRATOR")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { etId } = await params;
  const body = await req.json();
  const { name, labelCs, labelEn, value, affectsScore, color, icon, sortOrder } = body;
  const et = await prisma.eventType.update({
    where: { id: etId },
    data: {
      ...(name !== undefined && { name }),
      ...(labelCs !== undefined && { labelCs }),
      ...(labelEn !== undefined && { labelEn }),
      ...(value !== undefined && { value: value === "" || value === null ? null : Number(value) }),
      ...(affectsScore !== undefined && { affectsScore }),
      ...(color !== undefined && { color }),
      ...(icon !== undefined && { icon }),
      ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
    },
  });
  return NextResponse.json(et);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; etId: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMINISTRATOR")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { etId } = await params;
  await prisma.eventType.delete({ where: { id: etId } });
  return NextResponse.json({ success: true });
}
