import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

function createPrisma() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;
  if (tursoUrl) {
    const adapter = new PrismaLibSql({ url: tursoUrl, authToken: tursoToken });
    return new PrismaClient({ adapter });
  }
  const dbPath = path.resolve(process.cwd(), "prisma/dev.db");
  const adapter = new PrismaBetterSqlite3({ url: dbPath });
  return new PrismaClient({ adapter });
}

const prisma = createPrisma();

async function main() {
  const sports = await prisma.sport.findMany({ include: { eventTypes: true } });
  const byName = Object.fromEntries(sports.map((s) => [s.name, s]));

  type ET = {
    name: string;
    labelCs: string;
    labelEn: string;
    affectsScore: boolean;
    value?: number | null;
    color?: string | null;
    icon?: string | null;
    sortOrder: number;
  };

  const missing: Record<string, ET[]> = {
    Fotbal: [
      { name: "YELLOW_CARD",   labelCs: "Žlutá karta",      labelEn: "Yellow Card",     affectsScore: false, color: "#EAB308", icon: "square", sortOrder: 10 },
      { name: "RED_CARD",      labelCs: "Červená karta",    labelEn: "Red Card",        affectsScore: false, color: "#EF4444", icon: "square", sortOrder: 20 },
      { name: "SUBSTITUTION",  labelCs: "Střídání",         labelEn: "Substitution",    affectsScore: false, color: "#6B7280", icon: "arrow-left-right", sortOrder: 30 },
    ],
    Florbal: [
      { name: "OWN_GOAL",      labelCs: "Vlastní gól",      labelEn: "Own Goal",        affectsScore: true,  value: 1, color: "#F97316", icon: "goal-net", sortOrder: 5 },
    ],
    Volejbal: [
      { name: "TIMEOUT",       labelCs: "Time-out",         labelEn: "Timeout",         affectsScore: false, color: "#6B7280", icon: "pause", sortOrder: 10 },
      { name: "SUBSTITUTION",  labelCs: "Střídání",         labelEn: "Substitution",    affectsScore: false, color: "#6B7280", icon: "arrow-left-right", sortOrder: 20 },
      { name: "ACE",           labelCs: "Eso",              labelEn: "Ace",             affectsScore: true,  value: 1, color: "#10B981", icon: "zap", sortOrder: 30 },
      { name: "ERROR",         labelCs: "Chyba soupeře",    labelEn: "Opponent Error",  affectsScore: true,  value: 1, color: "#8B5CF6", icon: "x-circle", sortOrder: 40 },
    ],
  };

  for (const [sportName, events] of Object.entries(missing)) {
    const sport = byName[sportName];
    if (!sport) { console.log(`Sport ${sportName} not found, skipping`); continue; }

    const existingNames = new Set(sport.eventTypes.map((e) => e.name));

    for (const ev of events) {
      if (existingNames.has(ev.name)) {
        console.log(`  SKIP ${sportName} / ${ev.name} (already exists)`);
        continue;
      }
      await prisma.eventType.create({
        data: { sportId: sport.id, ...ev },
      });
      console.log(`  ADD  ${sportName} / ${ev.name}`);
    }
  }

  console.log("Done.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
