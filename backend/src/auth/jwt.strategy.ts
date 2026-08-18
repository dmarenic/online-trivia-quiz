import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser, JwtPayload } from './auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET as string,
    });
  }

  // Passport poziva validate() nakon što je potpis tokena već provjeren.
  // Korisnik se namjerno ponovno čita iz baze umjesto da se vjeruje podacima
  // iz payloada: tako obrisan korisnik s još valjanim tokenom nema pristup, a
  // rute uvijek dobiju svježu ulogu i profil (JWT je nepromjenjiv nakon izdavanja).
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatar: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Korisnik ne postoji.');
    }

    return user;
  }
}
