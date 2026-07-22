import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { SubmitDailyDto } from './dto/submit-daily.dto';

const DAILY_CATEGORIES = ["Sport",
  "Geografija",
  "Računarstvo",
  "Povijest",
  "Znanost",
  "Književnost",
  "Umjetnost",
  "Glazba",
  "Videoigre",
  "Trendovi i aktualnosti",
  "Poslovanje i brendovi",
  "Životinje",
  "Ljudsko tijelo i zdravlje"];

@Controller('daily-challenge')
export class DailyChallengeController {
  constructor(private prisma: PrismaService) {}

  @Get('leaderboard')
  async getDailyLeaderboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.gameResult.findMany({
      where: {
        mode: 'daily',
        createdAt: {
          gte: today,
        },
      },
      orderBy: {
        score: 'desc',
      },
      take: 10,
      include: {
        user: {
          select: {
            username: true,
            avatar: true,
          },
        },
      },
    });
  }

  @Get()
async getTodayChallenge() {
  const today = new Date().toISOString().split('T')[0];

  let challenge = await this.prisma.dailyChallenge.findUnique({
    where: {
      date: today,
    },
  });

  if (!challenge) {
    // Rotacija kategorija po danima
    const startDate = new Date('2025-01-01');
    const currentDate = new Date(today);

    const daysPassed = Math.floor(
      (currentDate.getTime() - startDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    const category =
      DAILY_CATEGORIES[daysPassed % DAILY_CATEGORIES.length];

    challenge = await this.prisma.dailyChallenge.create({
      data: {
        title: `Daily ${category} Challenge`,
        description: `Odgovori na 5 pitanja iz kategorije ${category}.`,
        targetScore: 3000,
        category,
        questionCount: 5,
        date: today,
      },
    });
  }

  return challenge;
}

  @UseGuards(JwtAuthGuard)
  @Get('status/me')
  async getDailyStatus(@CurrentUser() user: any) {
    const userId = user.id;
    const today = new Date().toISOString().split('T')[0];

    const challenge = await this.prisma.dailyChallenge.findUnique({
      where: {
        date: today,
      },
    });

    if (!challenge) {
      return {
        played: false,
        completed: false,
      };
    }

    const attempt = await this.prisma.dailyChallengeAttempt.findFirst({
      where: {
        userId,
        challengeId: challenge.id,
      },
    });

    return {
      played: !!attempt,
      completed: attempt?.completed ?? false,
    };
  }

  @Get(':id/questions')
  async getDailyQuestions(@Param('id') id: string) {
    const challenge = await this.prisma.dailyChallenge.findUnique({
      where: {
        id,
      },
    });

    if (!challenge) {
      return [];
    }

    const questions = await this.prisma.question.findMany({
      where: {
        category: challenge.category,
      },
      take: challenge.questionCount,
      select: {
        id: true,
        category: true,
        question: true,
        optionA: true,
        optionB: true,
        optionC: true,
        optionD: true,
      },
    });

    return questions.map((question) => ({
      id: question.id,
      category: question.category,
      question: question.question,
      options: [
        question.optionA,
        question.optionB,
        question.optionC,
        question.optionD,
      ],
    }));
  }

  @UseGuards(JwtAuthGuard)
  @Post('submit')
  async submitDailyResult(
    @CurrentUser() user: any,
    @Body() body: SubmitDailyDto,
  ) {
    const userId = user.id;
    const today = new Date().toISOString().split('T')[0];

    const challenge = await this.prisma.dailyChallenge.findUnique({
      where: {
        date: today,
      },
    });

    if (!challenge) {
      return {
        success: false,
        message: 'Daily challenge ne postoji.',
      };
    }

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
        category: challenge.category,
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

    if (totalQuestions === 0) {
      return {
        success: false,
        message: 'Nema valjanih pitanja za ovaj daily challenge.',
      };
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const alreadyAttempted = await tx.dailyChallengeAttempt.findFirst({
        where: {
          userId,
          challengeId: challenge.id,
        },
      });

      if (alreadyAttempted) {
        return {
          success: true,
          completed: alreadyAttempted.completed,
          rewardClaimed: false,
          score: alreadyAttempted.score,
          correctAnswers: alreadyAttempted.correctAnswers,
          totalQuestions: alreadyAttempted.totalQuestions,
          message: 'Daily challenge si već igrao danas.',
        };
      }

      await tx.gameResult.create({
        data: {
          nickname: body.nickname,
          score,
          correctAnswers,
          totalQuestions,
          userId,
          mode: 'daily',
        },
      });

      await tx.dailyChallengeAttempt.create({
        data: {
          userId,
          challengeId: challenge.id,
          score,
          correctAnswers,
          totalQuestions,
          completed: score >= challenge.targetScore,
        },
      });

      if (score < challenge.targetScore) {
        return {
          success: true,
          completed: false,
          rewardClaimed: false,
          score,
          correctAnswers,
          totalQuestions,
          message: 'Nisi ispunio daily challenge.',
        };
      }

      return {
        success: true,
        completed: true,
        rewardClaimed: true,
        score,
        correctAnswers,
        totalQuestions,
        message: 'Daily challenge završen!',
      };
    });

    return result;
  }
}
