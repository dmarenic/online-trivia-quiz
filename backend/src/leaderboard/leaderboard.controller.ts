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
            avatar: true,
          },
        },
      },
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async saveResult(@CurrentUser() user: any, @Body() body: SaveResultDto) {
    const uniqueAnswers = Array.from(
      new Map(
        body.answers.map((answer) => [answer.questionId, answer]),
      ).values(),
    );

    const questionIds = uniqueAnswers.map((answer) => answer.questionId);

    const questions = await this.prisma.question.findMany({
      where: {
        id: {
          in: questionIds,
        },
      },
    });

    let correctAnswers = 0;

    for (const answer of uniqueAnswers) {
      const question = questions.find((q) => q.id === answer.questionId);

      if (question && question.correctAnswer === answer.answer) {
        correctAnswers++;
      }
    }

    const totalQuestions = questions.length;
    const score = correctAnswers * 1000;

    return this.prisma.gameResult.create({
      data: {
        nickname: body.nickname,
        score,
        userId: user.id,
        correctAnswers,
        totalQuestions,
        mode: body.mode || 'classic',
      },
    });
  }
}
