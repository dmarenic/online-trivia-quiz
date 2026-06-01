-- AlterTable
ALTER TABLE "DailyChallenge" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'Sport',
ADD COLUMN     "questionCount" INTEGER NOT NULL DEFAULT 5;
