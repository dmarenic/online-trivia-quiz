import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SaveResultDto } from './dto/save-result.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

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

  @UseGuards(JwtAuthGuard)
  @Post()
  async saveResult(
    @CurrentUser() user: any,
    @Body() body: SaveResultDto,
  ) {
    return this.prisma.gameResult.create({
      data: {
        nickname: body.nickname,
        score: body.score,
        userId: user.id,
        correctAnswers: body.correctAnswers ?? 0,
        totalQuestions: body.totalQuestions ?? 0,
        mode: body.mode ?? 'classic',
      },
    });
  }
}