import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getLeaderboard() {
    return this.prisma.gameResult.findMany({
      orderBy: {
        score: 'desc',
      },
      take: 10,
    });
  }
}