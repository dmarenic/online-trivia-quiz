import {
  Body,
  ConflictException,
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
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  AddFriendDto,
  InviteRoomDto,
  UpdateAvatarDto,
  UpdateUsernameDto,
} from './dto/users.dto';

// Točnost jednog meča u rasponu 0–100%, zaokružena na 1 decimalu.
// Robusno na prljave podatke: correctAnswers se ograničava na [0, totalQuestions],
// a meč bez pitanja (totalQuestions <= 0) daje 0 umjesto NaN.
export function matchAccuracy(
  correctAnswers: number,
  totalQuestions: number,
): number {
  if (totalQuestions <= 0) return 0;

  const clampedCorrect = Math.min(Math.max(correctAnswers, 0), totalQuestions);

  return Number(((clampedCorrect / totalQuestions) * 100).toFixed(1));
}

// Ukupna ("mikro") točnost (Definicija A): Σ točnih / Σ svih pitanja × 100.
// Redovi bez pitanja se preskaču, a correctAnswers se po redu ograničava na
// totalQuestions da prljav red ne napuhne rezultat iznad 100%.
export function aggregateAccuracy(
  results: { correctAnswers: number; totalQuestions: number }[],
): number {
  let totalCorrect = 0;
  let totalQuestions = 0;

  for (const result of results) {
    if (result.totalQuestions <= 0) continue;

    totalCorrect += Math.min(result.correctAnswers, result.totalQuestions);
    totalQuestions += result.totalQuestions;
  }

  return matchAccuracy(totalCorrect, totalQuestions);
}

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

    return matches.map((match) => ({
      ...match,
      accuracy: matchAccuracy(match.correctAnswers, match.totalQuestions),
    }));
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/results')
  async getMyResults(@CurrentUser() user: any) {
    const results = await this.prisma.gameResult.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      results,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/stats')
  async getMyStats(@CurrentUser() user: any) {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        results: true,
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

    const accuracy = aggregateAccuracy(dbUser.results);

    return {
      totalGames,
      bestScore,
      averageScore: Number(averageScore.toFixed(1)),
      accuracy,
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
      },
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/username')
  async updateUsername(
    @CurrentUser() user: any,
    @Body()
    body: UpdateUsernameDto,
  ) {
    // Nadimak se veže na prijavljenog korisnika iz JWT-a, nikad iz tijela zahtjeva.
    try {
      return await this.prisma.user.update({
        where: { id: user.id },
        data: {
          username: body.username,
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          avatar: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Nadimak je već zauzet.');
      }

      throw error;
    }
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
