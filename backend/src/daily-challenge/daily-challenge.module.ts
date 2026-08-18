import { Module } from '@nestjs/common';
import { DailyChallengeController } from './daily-challenge.controller';

@Module({
  controllers: [DailyChallengeController],
})
export class DailyChallengeModule {}
