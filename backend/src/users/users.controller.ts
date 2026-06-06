import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AddFriendDto, InviteRoomDto, UpdateAvatarDto } from './dto/users.dto';

@Controller('users')
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me/match-history')
  async getMyMatchHistory(@CurrentUser() user: any) {
    const matches = await this.prisma.gameResult.findMany({
      where: { userId: user.id },
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

  @UseGuards(JwtAuthGuard)
  @Get('me/results')
  async getMyResults(@CurrentUser() user: any) {
    const results = await this.prisma.gameResult.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const achievements = await this.prisma.achievement.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      results,
      achievements,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/stats')
  async getMyStats(@CurrentUser() user: any) {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        results: true,
        achievements: true,
      },
    });

    if (!dbUser) {
      throw new NotFoundException('Korisnik nije pronađen');
    }

    const totalGames = dbUser.results.length;

    const bestScore =
      totalGames > 0
        ? Math.max(...dbUser.results.map((result) => result.score))
        : 0;

    const averageScore =
      totalGames > 0
        ? dbUser.results.reduce((sum, result) => sum + result.score, 0) /
          totalGames
        : 0;

    const totalCorrect = dbUser.results.reduce(
      (sum, result) => sum + result.correctAnswers,
      0,
    );

    const totalQuestions = dbUser.results.reduce(
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
      totalXp: dbUser.xp,
      level: dbUser.level,
      achievementCount: dbUser.achievements.length,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/avatar')
  async updateAvatar(
    @CurrentUser() user: any,
    @Body()
    body: UpdateAvatarDto,
  ) {
    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        avatar: body.avatar,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatar: true,
        xp: true,
        level: true,
        dailyStreak: true,
        lastDailyDate: true,
      },
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('invite-room')
  async inviteToRoom(@CurrentUser() user: any, @Body() body: InviteRoomDto) {
    if (body.toUserId === user.id) {
      throw new ForbiddenException('Ne možeš poslati pozivnicu sam sebi.');
    }

    const receiver = await this.prisma.user.findUnique({
      where: {
        id: body.toUserId,
      },
    });

    if (!receiver) {
      throw new NotFoundException(
        'Korisnik kojem šalješ pozivnicu ne postoji.',
      );
    }

    const friendship = await this.prisma.friend.findFirst({
      where: {
        OR: [
          {
            senderId: user.id,
            receiverId: body.toUserId,
          },
          {
            senderId: body.toUserId,
            receiverId: user.id,
          },
        ],
      },
    });

    if (!friendship) {
      throw new ForbiddenException('Pozivnicu možeš poslati samo prijatelju.');
    }

    await this.prisma.roomInvite.deleteMany({
      where: {
        OR: [
          {
            fromUserId: user.id,
            toUserId: body.toUserId,
            roomCode: body.roomCode,
          },
          {
            createdAt: {
              lt: new Date(Date.now() - 30000),
            },
          },
        ],
      },
    });

    return this.prisma.roomInvite.create({
      data: {
        fromUserId: user.id,
        toUserId: body.toUserId,
        roomCode: body.roomCode,
      },
    });
  }

  @UseGuards(JwtAuthGuard)
  @Delete('room-invites/:inviteId')
  async deleteRoomInvite(
    @CurrentUser() user: any,
    @Param('inviteId') inviteId: string,
  ) {
    const invite = await this.prisma.roomInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite || invite.toUserId !== user.id) {
      throw new ForbiddenException('Nemaš pristup ovoj pozivnici.');
    }

    return this.prisma.roomInvite.delete({
      where: { id: inviteId },
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/room-invites')
  async getRoomInvites(@CurrentUser() user: any) {
    const expiresAt = new Date(Date.now() - 30000);

    await this.prisma.roomInvite.deleteMany({
      where: {
        createdAt: {
          lt: expiresAt,
        },
      },
    });

    return this.prisma.roomInvite.findMany({
      where: {
        toUserId: user.id,
        createdAt: {
          gte: expiresAt,
        },
      },
      include: {
        fromUser: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/friends')
  async addFriend(@CurrentUser() user: any, @Body() body: AddFriendDto) {
    const friend = await this.prisma.user.findUnique({
      where: { username: body.username },
    });

    if (!friend) {
      return { message: 'Korisnik ne postoji', success: false };
    }

    if (friend.id === user.id) {
      return { message: 'Ne možeš dodati sebe', success: false };
    }

    const existing = await this.prisma.friend.findFirst({
      where: {
        OR: [
          { senderId: user.id, receiverId: friend.id },
          { senderId: friend.id, receiverId: user.id },
        ],
      },
    });

    if (existing?.status === 'accepted') {
      return { message: 'Već ste prijatelji', success: false };
    }

    if (existing?.status === 'pending') {
      return { message: 'Zahtjev je već poslan.', success: false };
    }

    await this.prisma.friend.create({
      data: {
        senderId: user.id,
        receiverId: friend.id,
        status: 'pending',
      },
    });

    return {
      success: true,
      message: 'Zahtjev za prijateljstvo poslan.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/achievements')
  async getAchievements(@CurrentUser() user: any) {
    const unlocked = await this.prisma.achievement.findMany({
      where: { userId: user.id },
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

  @UseGuards(JwtAuthGuard)
  @Get('me/friends')
  async getFriends(@CurrentUser() user: any) {
    const friends = await this.prisma.friend.findMany({
      where: {
        status: 'accepted',
        OR: [{ senderId: user.id }, { receiverId: user.id }],
      },
      include: {
        sender: {
          select: { id: true, username: true, avatar: true },
        },
        receiver: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    const incomingRequests = await this.prisma.friend.findMany({
      where: {
        receiverId: user.id,
        status: 'pending',
      },
      include: {
        sender: {
          select: { id: true, username: true, avatar: true },
        },
        receiver: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    const outgoingRequests = await this.prisma.friend.findMany({
      where: {
        senderId: user.id,
        status: 'pending',
      },
      include: {
        sender: {
          select: { id: true, username: true, avatar: true },
        },
        receiver: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    return {
      friends,
      incomingRequests,
      outgoingRequests,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/friends/:requestId/accept')
  async acceptFriendRequest(
    @CurrentUser() user: any,
    @Param('requestId') requestId: string,
  ) {
    const request = await this.prisma.friend.findUnique({
      where: { id: requestId },
    });

    if (!request || request.receiverId !== user.id) {
      throw new ForbiddenException('Nemaš pristup ovom zahtjevu.');
    }

    return this.prisma.friend.update({
      where: { id: requestId },
      data: { status: 'accepted' },
    });
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/friends/:requestId/reject')
  async rejectFriendRequest(
    @CurrentUser() user: any,
    @Param('requestId') requestId: string,
  ) {
    const request = await this.prisma.friend.findUnique({
      where: { id: requestId },
    });

    if (!request || request.receiverId !== user.id) {
      throw new ForbiddenException('Nemaš pristup ovom zahtjevu.');
    }

    return this.prisma.friend.delete({
      where: { id: requestId },
    });
  }
}
