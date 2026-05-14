import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

const dbPath = path.resolve(process.cwd(), "prisma/dev.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...\n");

  // ── Admin user ─────────────────────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@ligakit.cz";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123456";
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Admin",
        password: await bcrypt.hash(adminPassword, 12),
        role: "ADMINISTRATOR",
      },
    });
    console.log(`✅ Admin: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log(`⏭  Admin ${adminEmail} already exists`);
  }

  // ── Football ───────────────────────────────────────────────────────────────
  let football = await prisma.sport.findFirst({ where: { name: "Fotbal" } });
  if (!football) {
    football = await prisma.sport.create({
      data: {
        name: "Fotbal",
        config: JSON.stringify({
          engine: "football",
          periods: 2,
          periodDuration: 45,
          scoring: { win: 3, draw: 1, loss: 0 },
        }),
      },
    });
    console.log("✅ Sport: Fotbal");

    // Positions
    const footballPositions = [
      { name: "GK", labelCs: "Brankář", labelEn: "Goalkeeper" },
      { name: "DEF", labelCs: "Obránce", labelEn: "Defender" },
      { name: "MID", labelCs: "Záložník", labelEn: "Midfielder" },
      { name: "FWD", labelCs: "Útočník", labelEn: "Forward" },
    ];
    for (const pos of footballPositions) {
      await prisma.position.create({ data: { ...pos, sportId: football.id } });
    }
    console.log("✅ Positions: Fotbal");

    // Event types
    const footballEvents = [
      { name: "GOAL", labelCs: "Gól", labelEn: "Goal", icon: "⚽", affectsScore: true, value: 1 },
      { name: "OWN_GOAL", labelCs: "Vlastní gól", labelEn: "Own goal", icon: "⚽", affectsScore: true, value: 1 },
      { name: "YELLOW_CARD", labelCs: "Žlutá karta", labelEn: "Yellow card", icon: "🟨", affectsScore: false, value: 0 },
      { name: "RED_CARD", labelCs: "Červená karta", labelEn: "Red card", icon: "🟥", affectsScore: false, value: 0 },
      { name: "SUBSTITUTION", labelCs: "Střídání", labelEn: "Substitution", icon: "🔄", affectsScore: false, value: 0 },
      { name: "PENALTY_GOAL", labelCs: "Gól z penalty", labelEn: "Penalty goal", icon: "🎯", affectsScore: true, value: 1 },
      { name: "PENALTY_MISS", labelCs: "Neproměněná penalta", labelEn: "Penalty miss", icon: "❌", affectsScore: false, value: 0 },
    ];
    for (const et of footballEvents) {
      await prisma.eventType.create({ data: { ...et, sportId: football.id } });
    }
    console.log("✅ Event types: Fotbal");
  } else {
    console.log("⏭  Sport Fotbal already exists");
  }

  // ── Futsal ─────────────────────────────────────────────────────────────────
  let futsal = await prisma.sport.findFirst({ where: { name: "Futsal" } });
  if (!futsal) {
    futsal = await prisma.sport.create({
      data: {
        name: "Futsal",
        config: JSON.stringify({
          engine: "football",
          periods: 2,
          periodDuration: 20,
          scoring: { win: 3, draw: 1, loss: 0 },
        }),
      },
    });
    console.log("✅ Sport: Futsal");

    const futsalPositions = [
      { name: "GK", labelCs: "Brankář", labelEn: "Goalkeeper" },
      { name: "DEF", labelCs: "Obránce", labelEn: "Defender" },
      { name: "MID", labelCs: "Pivoto", labelEn: "Pivot" },
      { name: "FWD", labelCs: "Útočník", labelEn: "Forward" },
    ];
    for (const pos of futsalPositions) {
      await prisma.position.create({ data: { ...pos, sportId: futsal.id } });
    }

    const futsalEvents = [
      { name: "GOAL", labelCs: "Gól", labelEn: "Goal", icon: "⚽", affectsScore: true, value: 1 },
      { name: "YELLOW_CARD", labelCs: "Žlutá karta", labelEn: "Yellow card", icon: "🟨", affectsScore: false, value: 0 },
      { name: "RED_CARD", labelCs: "Červená karta", labelEn: "Red card", icon: "🟥", affectsScore: false, value: 0 },
      { name: "SUBSTITUTION", labelCs: "Střídání", labelEn: "Substitution", icon: "🔄", affectsScore: false, value: 0 },
      { name: "TIMEOUT", labelCs: "Time-out", labelEn: "Time-out", icon: "⏱️", affectsScore: false, value: 0 },
    ];
    for (const et of futsalEvents) {
      await prisma.eventType.create({ data: { ...et, sportId: futsal.id } });
    }
    console.log("✅ Sport: Futsal + positions + event types");
  } else {
    console.log("⏭  Sport Futsal already exists");
  }

  // ── Floorball / Florbal ────────────────────────────────────────────────────
  let floorball = await prisma.sport.findFirst({ where: { name: "Florbal" } });
  if (!floorball) {
    floorball = await prisma.sport.create({
      data: {
        name: "Florbal",
        config: JSON.stringify({
          engine: "generic",
          periods: 3,
          periodDuration: 20,
          scoring: { win: 3, draw: 1, loss: 0 },
        }),
      },
    });

    const floorballPositions = [
      { name: "GK", labelCs: "Brankář", labelEn: "Goalkeeper" },
      { name: "DEF", labelCs: "Obránce", labelEn: "Defender" },
      { name: "FWD", labelCs: "Útočník", labelEn: "Forward" },
    ];
    for (const pos of floorballPositions) {
      await prisma.position.create({ data: { ...pos, sportId: floorball.id } });
    }

    const floorballEvents = [
      { name: "GOAL", labelCs: "Gól", labelEn: "Goal", icon: "🏑", affectsScore: true, value: 1 },
      { name: "YELLOW_CARD", labelCs: "Žlutá karta", labelEn: "Yellow card", icon: "🟨", affectsScore: false, value: 0 },
      { name: "RED_CARD", labelCs: "Červená karta", labelEn: "Red card", icon: "🟥", affectsScore: false, value: 0 },
      { name: "SUBSTITUTION", labelCs: "Střídání", labelEn: "Substitution", icon: "🔄", affectsScore: false, value: 0 },
      { name: "PENALTY_2MIN", labelCs: "Trest 2 min", labelEn: "2 min penalty", icon: "⏱️", affectsScore: false, value: 0 },
    ];
    for (const et of floorballEvents) {
      await prisma.eventType.create({ data: { ...et, sportId: floorball.id } });
    }
    console.log("✅ Sport: Florbal + positions + event types");
  } else {
    console.log("⏭  Sport Florbal already exists");
  }

  // ── Volejbal ───────────────────────────────────────────────────────────────
  let volleyball = await prisma.sport.findFirst({ where: { name: "Volejbal" } });
  if (!volleyball) {
    volleyball = await prisma.sport.create({
      data: {
        name: "Volejbal",
        config: JSON.stringify({
          engine: "generic",
          periods: 5,
          periodDuration: 0,
          scoring: { win: 3, draw: 0, loss: 0 },
        }),
      },
    });

    const volleyballEvents = [
      { name: "SET_WIN", labelCs: "Set", labelEn: "Set won", icon: "🏐", affectsScore: true, value: 1 },
    ];
    for (const et of volleyballEvents) {
      await prisma.eventType.create({ data: { ...et, sportId: volleyball.id } });
    }
    console.log("✅ Sport: Volejbal + event types");
  } else {
    console.log("⏭  Sport Volejbal already exists");
  }

  console.log("\n🎉 Seed complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
