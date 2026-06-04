import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private createToken(user: { id: string; email: string; role: string }) {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async register(body: any) {
    const { username, email, password } = body;

    if (!username || !email || !password) {
      throw new BadRequestException('Sva polja su obavezna.');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      throw new BadRequestException('Korisnik već postoji.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
        xp: true,
        level: true,
        dailyStreak: true,
        lastDailyDate: true,
      },
    });

    return {
      user,
      accessToken: this.createToken(user),
    };
  }

  async login(body: any) {
    const { email, password } = body;

    if (!email || !password) {
      throw new BadRequestException('Email i password su obavezni.');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      throw new BadRequestException('Pogrešan email ili password.');
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      throw new BadRequestException('Pogrešan email ili password.');
    }

    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      xp: user.xp,
      level: user.level,
      dailyStreak: user.dailyStreak,
      lastDailyDate: user.lastDailyDate,
    };

    return {
      user: safeUser,
      accessToken: this.createToken(user),
    };
  }
}