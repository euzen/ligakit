-- AlterTable
ALTER TABLE "Match" ADD COLUMN "awayFormation" TEXT;
ALTER TABLE "Match" ADD COLUMN "awayLineupPositions" JSONB;
ALTER TABLE "Match" ADD COLUMN "homeFormation" TEXT;
ALTER TABLE "Match" ADD COLUMN "homeLineupPositions" JSONB;
