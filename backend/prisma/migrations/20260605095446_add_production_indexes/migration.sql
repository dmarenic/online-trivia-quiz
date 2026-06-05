/*
  Warnings:

  - A unique constraint covering the columns `[userId,title]` on the table `Achievement` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "Achievement_userId_idx" ON "Achievement"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_userId_title_key" ON "Achievement"("userId", "title");

-- CreateIndex
CREATE INDEX "DailyChallengeCompletion_userId_idx" ON "DailyChallengeCompletion"("userId");

-- CreateIndex
CREATE INDEX "DailyChallengeCompletion_challengeId_idx" ON "DailyChallengeCompletion"("challengeId");

-- CreateIndex
CREATE INDEX "GameResult_userId_idx" ON "GameResult"("userId");

-- CreateIndex
CREATE INDEX "GameResult_createdAt_idx" ON "GameResult"("createdAt");

-- CreateIndex
CREATE INDEX "GameResult_mode_idx" ON "GameResult"("mode");

-- CreateIndex
CREATE INDEX "RoomInvite_toUserId_idx" ON "RoomInvite"("toUserId");

-- CreateIndex
CREATE INDEX "RoomInvite_fromUserId_idx" ON "RoomInvite"("fromUserId");

-- CreateIndex
CREATE INDEX "RoomInvite_roomCode_idx" ON "RoomInvite"("roomCode");
