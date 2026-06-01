import { Body, Controller, Get, Post } from '@nestjs/common';
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
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  }

  @Post()
  async saveResult(
    @Body()
    body: {
      nickname: string;
      score: number;
      userId?: string;
    },
  ) {
    const { nickname, score, userId } = body;

    return this.prisma.gameResult.create({
      data: {
        nickname,
        score,
        userId,
      },
    });
  }
}