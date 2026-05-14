import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: teamId } = await params;
  const isAdmin = session.user.role === "ADMINISTRATOR";

  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        players: {
          orderBy: [{ number: "asc" }, { name: "asc" }],
          include: { position: { select: { name: true } } },
        },
      },
    });

    if (!team) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!isAdmin && team.ownerId !== session.user.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const rows = team.players.map((p) => ({
      "ID": p.id,
      "#": p.number ?? "",
      "Jmeno": p.name,
      "Pozice": p.position?.name ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 6 }, { wch: 30 }, { wch: 20 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Soupiska");

    const b64: string = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
    const binary = Buffer.from(b64, "base64");

    const safeName = team.name.replace(/[^a-zA-Z0-9_\-]/g, "_");
    return new NextResponse(binary, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${safeName}_soupiska.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[roster/export]", err);
    return NextResponse.json({ error: "Export failed", detail: String(err) }, { status: 500 });
  }
}
