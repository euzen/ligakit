import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: teamId } = await params;
  const isAdmin = session.user.role === "ADMINISTRATOR";

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      sport: { include: { positions: true } },
    },
  });
  if (!team) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isAdmin && team.ownerId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || typeof file === "string")
    return NextResponse.json({ error: "FILE_REQUIRED" }, { status: 400 });

  const arrayBuffer = await (file as File).arrayBuffer();
  const wb = XLSX.read(arrayBuffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(ws);

  if (rows.length === 0)
    return NextResponse.json({ error: "EMPTY_FILE" }, { status: 400 });

  const positions = team.sport?.positions ?? [];

  const resolvePosition = (raw: string | undefined): string | null => {
    if (!raw) return null;
    const normalized = String(raw).trim().toLowerCase();
    const match = positions.find(
      (p) =>
        p.name.toLowerCase() === normalized ||
        p.labelCs.toLowerCase() === normalized ||
        p.labelEn.toLowerCase() === normalized,
    );
    return match?.id ?? null;
  };

  let createdCount = 0;
  let updatedCount = 0;
  const errors: string[] = [];

  for (const [i, row] of rows.entries()) {
    const name = String(row["Jméno"] ?? row["Jmeno"] ?? row["Name"] ?? row["name"] ?? "").trim();
    if (!name) {
      errors.push(`Řádek ${i + 2}: chybí jméno`);
      continue;
    }
    const rawNum = row["#"] ?? row["Cislo"] ?? row["Number"] ?? "";
    const num = rawNum !== "" && rawNum !== undefined ? Number(rawNum) : null;
    const number = num !== null && isNaN(num) ? null : num;
    const rawPos = String(row["Pozice"] ?? row["Position"] ?? "").trim();
    const positionId = resolvePosition(rawPos || undefined);
    const rowId = String(row["ID"] ?? "").trim();

    try {
      if (rowId) {
        const existing = await prisma.player.findFirst({ where: { id: rowId, teamId } });
        if (existing) {
          await prisma.player.update({
            where: { id: rowId },
            data: { name, number, positionId },
          });
          updatedCount++;
          continue;
        }
      }
      await prisma.player.create({ data: { teamId, name, number, positionId } });
      createdCount++;
    } catch {
      errors.push(`Řádek ${i + 2}: ${name} – chyba při ukládání`);
    }
  }

  return NextResponse.json({ created: createdCount, updated: updatedCount, errors });
}
