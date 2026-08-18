import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

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

  async register(body: RegisterDto) {
    // Email se normalizira na mala slova jer je u bazi unique: bez toga bi se
    // "Ime@mail.com" i "ime@mail.com" registrirali kao dva različita računa.
    const username = body.username.trim();
    const email = body.email.trim().toLowerCase();
    const password = body.password;

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

    // Lozinka se nikada ne sprema u izvornom obliku. bcrypt sam generira i u
    // hash ugrađuje "salt", pa dva korisnika s istom lozinkom imaju različit
    // hash; faktor 10 je kompromis između otpornosti na napad grubom silom i
    // trajanja prijave.
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
      },
    });

    return {
      user,
      accessToken: this.createToken(user),
    };
  }

  async login(body: LoginDto) {
    const email = body.email.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      throw new BadRequestException('Email i password su obavezni.');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    // Namjerno ista poruka za nepostojeći email i za krivu lozinku: različite
    // poruke napadaču otkrivaju koji su emailovi registrirani u sustavu.
    if (!user) {
      throw new UnauthorizedException('Pogrešan email ili password.');
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      throw new UnauthorizedException('Pogrešan email ili password.');
    }

    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };

    return {
      user: safeUser,
      accessToken: this.createToken(user),
    };
  }
}
