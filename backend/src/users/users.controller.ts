import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('users')
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @Get(':id/stats')
async getUserStats(@Param('id') id: string) {
  const games = await this.prisma.gameResult.findMany({
    where: {
      userId: id,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const totalGames = games.length;
  const highestScore = games.length
    ? Math.max(...games.map((game) => game.score))
    : 0;

  const totalScore = games.reduce((sum, game) => sum + game.score, 0);

  const wins = games.filter((game) => game.score === highestScore).length;

  const averageScore = totalGames > 0
    ? Math.round(totalScore / totalGames)
    : 0;

  return {
    totalGames,
    highestScore,
    averageScore,
    totalScore,
    recentGames: games.slice(0, 10),
    wins,
  };
}


  @Get(':id/results')
  async getResults(@Param('id') id: string) {
    const results = await this.prisma.gameResult.findMany({
      where: {
        userId: id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    const achievements = await this.prisma.achievement.findMany({
      where: {
        userId: id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      results,
      achievements,
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
      where: {
        id,
      },
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
    where: {
      id: inviteId,
    },
  });
}

@Get(':id/room-invites')
async getRoomInvites(@Param('id') id: string) {
  return this.prisma.roomInvite.findMany({
    where: {
      toUserId: id,
    },
    include: {
      fromUser: {
        select: {
          username: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
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
        senderId: id,
        receiverId: friend.id,
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
    where: {
      userId: id,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const allAchievements = [
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
      OR: [
        { senderId: id },
        { receiverId: id },
      ],
    },
    include: {
      sender: true,
      receiver: true,
    },
  });
}
}