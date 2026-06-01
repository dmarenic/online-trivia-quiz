-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dailyStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastDailyDate" TEXT;
