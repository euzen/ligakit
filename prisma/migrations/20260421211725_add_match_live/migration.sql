-- AlterTable
ALTER TABLE "Match" ADD COLUMN "matchState" TEXT;
ALTER TABLE "Match" ADD COLUMN "period" INTEGER;
ALTER TABLE "Match" ADD COLUMN "startedAt" DATETIME;

-- CreateTable
CREATE TABLE "MatchEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "minute" INTEGER,
    "addedTime" INTEGER,
    "teamSide" TEXT NOT NULL,
    "playerName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MatchEvent_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MatchRefereeToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    CONSTRAINT "MatchRefereeToken_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "MatchRefereeToken_matchId_key" ON "MatchRefereeToken"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchRefereeToken_token_key" ON "MatchRefereeToken"("token");
