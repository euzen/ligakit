-- AlterTable
ALTER TABLE "Competition" ADD COLUMN "logoUrl" TEXT;

-- AlterTable
ALTER TABLE "MatchEvent" ADD COLUMN "player2Name" TEXT;

-- AlterTable
ALTER TABLE "Sport" ADD COLUMN "config" TEXT;
ALTER TABLE "Sport" ADD COLUMN "description" TEXT;

-- CreateTable
CREATE TABLE "EventType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sportId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "labelCs" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "value" INTEGER,
    "affectsScore" BOOLEAN NOT NULL DEFAULT true,
    "color" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EventType_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LineupToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "teamSide" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    CONSTRAINT "LineupToken_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MatchPlayer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "playerId" TEXT,
    "guestPlayerId" TEXT,
    "teamSide" TEXT NOT NULL,
    "slot" TEXT NOT NULL DEFAULT 'STARTER',
    "shirtNumber" INTEGER,
    CONSTRAINT "MatchPlayer_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MatchPlayer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MatchPlayer_guestPlayerId_fkey" FOREIGN KEY ("guestPlayerId") REFERENCES "GuestPlayer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Position" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "labelCs" TEXT NOT NULL DEFAULT '',
    "labelEn" TEXT NOT NULL DEFAULT '',
    "sportId" TEXT NOT NULL,
    CONSTRAINT "Position_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Position" ("id", "name", "sportId") SELECT "id", "name", "sportId" FROM "Position";
DROP TABLE "Position";
ALTER TABLE "new_Position" RENAME TO "Position";
CREATE UNIQUE INDEX "Position_name_sportId_key" ON "Position"("name", "sportId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "EventType_sportId_name_key" ON "EventType"("sportId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "LineupToken_token_key" ON "LineupToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "LineupToken_matchId_teamSide_key" ON "LineupToken"("matchId", "teamSide");
