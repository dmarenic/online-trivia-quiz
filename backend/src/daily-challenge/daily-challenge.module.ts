import { Module } from '@nestjs/common';
import { DailyChallengeController } from './daily-challenge.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [DailyChallengeController],
  providers: [PrismaService],
})
export class DailyChallengeModule {}