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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Competition_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Competition_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Competition" ("createdAt", "description", "endDate", "id", "isPublic", "name", "organizerId", "periodCount", "periodDuration", "sportId", "startDate", "status", "type", "updatedAt") SELECT "createdAt", "description", "endDate", "id", "isPublic", "name", "organizerId", "periodCount", "periodDuration", "sportId", "startDate", "status", "type", "updatedAt" FROM "Competition";
DROP TABLE "Competition";
ALTER TABLE "new_Competition" RENAME TO "Competition";
CREATE TABLE "new_CompetitionTeam" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "competitionId" TEXT NOT NULL,
    "teamId" TEXT,
    "guestName" TEXT,
    "rosterToken" TEXT,
    "isWaitlisted" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompetitionTeam_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CompetitionTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CompetitionTeam" ("competitionId", "guestName", "id", "joinedAt", "rosterToken", "teamId") SELECT "competitionId", "guestName", "id", "joinedAt", "rosterToken", "teamId" FROM "CompetitionTeam";
DROP TABLE "CompetitionTeam";
ALTER TABLE "new_CompetitionTeam" RENAME TO "CompetitionTeam";
CREATE UNIQUE INDEX "CompetitionTeam_rosterToken_key" ON "CompetitionTeam"("rosterToken");
CREATE UNIQUE INDEX "CompetitionTeam_competitionId_teamId_key" ON "CompetitionTeam"("competitionId", "teamId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
