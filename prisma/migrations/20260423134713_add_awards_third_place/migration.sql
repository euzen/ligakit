-- CreateTable
CREATE TABLE "CompetitionAward" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "competitionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "playerId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompetitionAward_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CompetitionAward_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Competition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "sportId" TEXT,
    "organizerId" TEXT NOT NULL,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "periodCount" INTEGER,
    "periodDuration" INTEGER,
    "maxTeams" INTEGER,
    "allowWaitlist" BOOLEAN NOT NULL DEFAULT false,
    "cupAdvancementPreset" TEXT,
    "cupTeamsPerGroup" INTEGER,
    "cupThirdPlaceAdvance" INTEGER,
    "cupCustomPairings" TEXT,
    "thirdPlaceMatch" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Competition_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Competition_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Competition" ("allowWaitlist", "createdAt", "cupAdvancementPreset", "cupCustomPairings", "cupTeamsPerGroup", "cupThirdPlaceAdvance", "description", "endDate", "id", "isPublic", "maxTeams", "name", "organizerId", "periodCount", "periodDuration", "sportId", "startDate", "status", "type", "updatedAt") SELECT "allowWaitlist", "createdAt", "cupAdvancementPreset", "cupCustomPairings", "cupTeamsPerGroup", "cupThirdPlaceAdvance", "description", "endDate", "id", "isPublic", "maxTeams", "name", "organizerId", "periodCount", "periodDuration", "sportId", "startDate", "status", "type", "updatedAt" FROM "Competition";
DROP TABLE "Competition";
ALTER TABLE "new_Competition" RENAME TO "Competition";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
