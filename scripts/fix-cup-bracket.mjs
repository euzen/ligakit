import Database from "better-sqlite3";

const db = new Database("./prisma/dev.db");
const id = process.argv[2];

if (!id) {
  console.error("Usage: node scripts/fix-cup-bracket.mjs <competitionId>");
  process.exit(1);
}

const groupMatches = db.prepare(
  "SELECT * FROM Match WHERE competitionId = ? AND note LIKE 'Skupina%'"
).all(id);

console.log(`Found ${groupMatches.length} group matches`);

// Check all played
const unplayed = groupMatches.filter(m => m.status !== "PLAYED");
if (unplayed.length > 0) {
  console.error(`${unplayed.length} group matches not yet played`);
  process.exit(1);
}

// Compute standings per group
const groups = {};
for (const m of groupMatches) {
  const grp = m.note;
  if (!groups[grp]) groups[grp] = {};
  const upd = (name, gf, ga, pts) => {
    if (!groups[grp][name]) groups[grp][name] = { name, pts: 0, gf: 0, ga: 0 };
    groups[grp][name].gf += gf;
    groups[grp][name].ga += ga;
    groups[grp][name].pts += pts;
  };
  const hs = m.homeScore;
  const as_ = m.awayScore;
  upd(m.homeTeamName, hs, as_, hs > as_ ? 3 : hs === as_ ? 1 : 0);
  upd(m.awayTeamName, as_, hs, as_ > hs ? 3 : hs === as_ ? 1 : 0);
}

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const slotMap = {};

Object.entries(groups).sort().forEach(([, teams], gi) => {
  const letter = letters[gi];
  const sorted = Object.values(teams).sort((a, b) =>
    b.pts !== a.pts ? b.pts - a.pts : (b.gf - b.ga) - (a.gf - a.ga)
  );
  console.log(`Group ${letter}:`, sorted.map(t => `${t.name}(${t.pts}pts)`).join(", "));
  sorted.forEach((t, pos) => {
    const posLabel = pos === 0 ? "1st" : pos === 1 ? "2nd" : "3rd";
    slotMap[`${posLabel} ${letter}`] = t.name;
  });
});

console.log("SlotMap:", slotMap);

// Get first bracket round
const bracketMatches = db.prepare(
  "SELECT * FROM Match WHERE competitionId = ? AND bracketPos IS NOT NULL ORDER BY round, bracketPos"
).all(id);

if (bracketMatches.length === 0) {
  console.error("No bracket matches found");
  process.exit(1);
}

const minRound = Math.min(...bracketMatches.map(m => m.round));
const firstRound = bracketMatches.filter(m => m.round === minRound);

console.log(`\nUpdating ${firstRound.length} first-round bracket matches:`);
for (const m of firstRound) {
  const homeReal = slotMap[m.homeTeamName] ?? m.homeTeamName;
  const awayReal = slotMap[m.awayTeamName] ?? m.awayTeamName;
  console.log(`  ${m.homeTeamName} → ${homeReal}  |  ${m.awayTeamName} → ${awayReal}`);
  db.prepare("UPDATE Match SET homeTeamName = ?, awayTeamName = ? WHERE id = ?")
    .run(homeReal, awayReal, m.id);
}

db.close();
console.log("\n✅ Done!");
