-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "difficulty" TEXT NOT NULL DEFAULT 'medium';

-- CreateIndex
CREATE INDEX "Question_difficulty_idx" ON "Question"("difficulty");
