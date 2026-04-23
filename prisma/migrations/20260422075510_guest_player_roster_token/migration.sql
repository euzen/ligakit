/*
  Warnings:

  - A unique constraint covering the columns `[rosterToken]` on the table `CompetitionTeam` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "CompetitionTeam" ADD COLUMN "rosterToken" TEXT;

-- CreateTable
CREATE TABLE "GuestPlayer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "competitionTeamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "number" INTEGER,
    CONSTRAINT "GuestPlayer_competitionTeamId_fkey" FOREIGN KEY ("competitionTeamId") REFERENCES "CompetitionTeam" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionTeam_rosterToken_key" ON "CompetitionTeam"("rosterToken");
