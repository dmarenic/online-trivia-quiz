import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

const DAILY_CATEGORIES = ['Geografija', 'Matematika', 'Računarstvo', 'Sport'];

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
      const randomCategory =
        DAILY_CATEGORIES[Math.floor(Math.random() * DAILY_CATEGORIES.length)];

      challenge = await this.prisma.dailyChallenge.create({
        data: {
          title: `Daily ${randomCategory} Challenge`,
          description: `Odgovori na 5 pitanja iz kategorije ${randomCategory}.`,
          targetScore: 3000,
          rewardXp: 100,
          category: randomCategory,
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

    const completion = await this.prisma.dailyChallengeCompletion.findFirst({
      where: {
        userId,
        challengeId: challenge.id,
      },
    });

    return {
      played: !!completion,
      completed: !!completion,
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
    @Body()
    body: {
      score: number;
      nickname: string;
    },
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

    await this.prisma.gameResult.create({
      data: {
        nickname: body.nickname,
        score: body.score,
        userId,
        mode: 'daily',
      },
    });

    if (body.score < challenge.targetScore) {
      return {
        success: true,
        completed: false,
        unlockedAchievements: [],
        message: 'Nisi ispunio daily challenge.',
      };
    }

    const alreadyCompleted =
      await this.prisma.dailyChallengeCompletion.findFirst({
        where: {
          userId,
          challengeId: challenge.id,
        },
      });

    if (alreadyCompleted) {
      return {
        success: true,
        completed: true,
        rewardClaimed: false,
        unlockedAchievements: [],
        message: 'Daily challenge je već završen danas.',
      };
    }

    await this.prisma.dailyChallengeCompletion.create({
      data: {
        userId,
        challengeId: challenge.id,
      },
    });

    const currentUser = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!currentUser) {
      return {
        success: false,
        message: 'Korisnik ne postoji.',
      };
    }

    const newXp = currentUser.xp + challenge.rewardXp;
    const newLevel = Math.floor(newXp / 1000) + 1;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];

    let newStreak = 1;

    if (currentUser.lastDailyDate === yesterdayString) {
      newStreak = currentUser.dailyStreak + 1;
    }

    if (currentUser.lastDailyDate === today) {
      newStreak = currentUser.dailyStreak;
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        xp: newXp,
        level: newLevel,
        dailyStreak: newStreak,
        lastDailyDate: today,
      },
    });

    const unlockedAchievements: string[] = [];

    const firstDailyAchievement = await this.prisma.achievement.findFirst({
      where: {
        userId,
        title: 'First Daily',
      },
    });

    if (!firstDailyAchievement) {
      await this.prisma.achievement.create({
        data: {
          userId,
          title: 'First Daily',
          description: 'Završi svoj prvi Daily Challenge.',
        },
      });

      unlockedAchievements.push('First Daily');
    }

    if (body.score >= 5000) {
      const dailyMasterAchievement =
        await this.prisma.achievement.findFirst({
          where: {
            userId,
            title: 'Daily Master',
          },
        });

      if (!dailyMasterAchievement) {
        await this.prisma.achievement.create({
          data: {
            userId,
            title: 'Daily Master',
            description: 'Osvoji maksimalan rezultat na Daily Challengeu.',
          },
        });

        unlockedAchievements.push('Daily Master');
      }
    }

    if (newStreak >= 3) {
      const streakAchievement = await this.prisma.achievement.findFirst({
        where: {
          userId,
          title: '3 Day Streak',
        },
      });

      if (!streakAchievement) {
        await this.prisma.achievement.create({
          data: {
            userId,
            title: '3 Day Streak',
            description: 'Završi Daily Challenge 3 dana zaredom.',
          },
        });

        unlockedAchievements.push('3 Day Streak');
      }
    }

    return {
      success: true,
      completed: true,
      rewardClaimed: true,
      rewardXp: challenge.rewardXp,
      totalXp: updatedUser.xp,
      level: updatedUser.level,
      dailyStreak: updatedUser.dailyStreak,
      unlockedAchievements,
      message: `Daily challenge završen! +${challenge.rewardXp} XP`,
    };
  }
}