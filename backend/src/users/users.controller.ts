import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('users')
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @Get(':id/match-history')
  async getMatchHistory(@Param('id') id: string) {
    const matches = await this.prisma.gameResult.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        nickname: true,
        score: true,
        correctAnswers: true,
        totalQuestions: true,
        mode: true,
        createdAt: true,
      },
    });

    return matches.map((match) => {
      const accuracy =
        match.totalQuestions > 0
          ? (match.correctAnswers / match.totalQuestions) * 100
          : 0;

      return {
        ...match,
        accuracy: Number(accuracy.toFixed(1)),
      };
    });
  }

  @Get(':id/results')
  async getResults(@Param('id') id: string) {
    const results = await this.prisma.gameResult.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const achievements = await this.prisma.achievement.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      results,
      achievements,
    };
  }

  @Get(':id/stats')
  async getUserStats(@Param('id') id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        results: true,
        achievements: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Korisnik nije pronađen');
    }

    const totalGames = user.results.length;

    const bestScore =
      totalGames > 0
        ? Math.max(...user.results.map((result) => result.score))
        : 0;

    const averageScore =
      totalGames > 0
        ? user.results.reduce((sum, result) => sum + result.score, 0) /
          totalGames
        : 0;

    const totalCorrect = user.results.reduce(
      (sum, result) => sum + result.correctAnswers,
      0,
    );

    const totalQuestions = user.results.reduce(
      (sum, result) => sum + result.totalQuestions,
      0,
    );

    const accuracy =
      totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    return {
      totalGames,
      bestScore,
      averageScore: Number(averageScore.toFixed(1)),
      accuracy: Number(accuracy.toFixed(1)),
      totalXp: user.xp,
      level: user.level,
      achievementCount: user.achievements.length,
    };
  }

  @Patch(':id/avatar')
  async updateAvatar(
    @Param('id') id: string,
    @Body()
    body: {
      avatar: string;
    },
  ) {
    return this.prisma.user.update({
      where: { id },
      data: {
        avatar: body.avatar,
      },
    });
  }

  @Post('invite-room')
  async inviteToRoom(
    @Body()
    body: {
      fromUserId: string;
      toUserId: string;
      roomCode: string;
    },
  ) {
    return this.prisma.roomInvite.create({
      data: {
        fromUserId: body.fromUserId,
        toUserId: body.toUserId,
        roomCode: body.roomCode,
      },
    });
  }

  @Delete('room-invites/:inviteId')
  async deleteRoomInvite(@Param('inviteId') inviteId: string) {
    return this.prisma.roomInvite.delete({
      where: { id: inviteId },
    });
  }

  @Get(':id/room-invites')
  async getRoomInvites(@Param('id') id: string) {
    return this.prisma.roomInvite.findMany({
      where: { toUserId: id },
      include: {
        fromUser: {
          select: {
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post(':id/friends')
  async addFriend(
    @Param('id') id: string,
    @Body()
    body: {
      username: string;
    },
  ) {
    const friend = await this.prisma.user.findUnique({
      where: {
        username: body.username,
      },
    });

    if (!friend) {
      return {
        message: 'Korisnik ne postoji',
        success: false,
      };
    }

    if (friend.id === id) {
      return {
        message: 'Ne možeš dodati sebe',
        success: false,
      };
    }

    const existing = await this.prisma.friend.findFirst({
      where: {
        OR: [
          {
            senderId: id,
            receiverId: friend.id,
          },
          {
            senderId: friend.id,
            receiverId: id,
          },
        ],
      },
    });

    if (existing) {
      return {
        message: 'Već ste prijatelji',
        success: false,
      };
    }

    await this.prisma.friend.create({
      data: {
        senderId: id,
        receiverId: friend.id,
      },
    });

    return {
      success: true,
    };
  }

  @Get(':id/achievements')
  async getAchievements(@Param('id') id: string) {
    const unlocked = await this.prisma.achievement.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
    });

    const allAchievements = [
      {
        title: 'First Game',
        description: 'Odigraj svoju prvu igru.',
      },
      {
        title: 'Quiz Rookie',
        description: 'Odigraj 5 igara.',
      },
      {
        title: '10 Games Played',
        description: 'Odigraj 10 igara.',
      },
      {
        title: 'Quiz Veteran',
        description: 'Odigraj 25 igara.',
      },
      {
        title: 'High Scorer',
        description: 'Ostvari 15 ili više bodova u jednoj igri.',
      },
      {
        title: 'Quiz Master',
        description: 'Ostvari 20 ili više bodova u jednoj igri.',
      },
      {
        title: 'Perfect Game',
        description: 'Odgovori točno na sva pitanja u jednoj igri.',
      },
      {
        title: 'Sharp Shooter',
        description: 'Ostvari barem 80% točnosti u jednoj igri.',
      },
      {
        title: 'Level 5',
        description: 'Dosegni level 5.',
      },
      {
        title: 'Level 10',
        description: 'Dosegni level 10.',
      },
      {
        title: 'First Daily',
        description: 'Završi svoj prvi Daily Challenge.',
      },
      {
        title: 'Daily Master',
        description: 'Osvoji maksimalan rezultat na Daily Challengeu.',
      },
      {
        title: '3 Day Streak',
        description: 'Završi Daily Challenge 3 dana zaredom.',
      },
      {
        title: '7 Day Streak',
        description: 'Završi Daily Challenge 7 dana zaredom.',
      },
    ];

    return allAchievements.map((achievement) => {
      const found = unlocked.find((u) => u.title === achievement.title);

      return {
        ...achievement,
        unlocked: !!found,
        unlockedAt: found?.createdAt || null,
      };
    });
  }

  @Get(':id/friends')
  async getFriends(@Param('id') id: string) {
    return this.prisma.friend.findMany({
      where: {
        OR: [{ senderId: id }, { receiverId: id }],
      },
      include: {
        sender: true,
        receiver: true,
      },
    });
  }
}