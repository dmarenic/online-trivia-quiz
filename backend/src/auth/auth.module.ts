import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

// Zadana vrijednost mora odgovarati onoj u backend/.env.example. Sustav nema
// refresh tokene, pa bi kratko trajanje značilo da korisnika izbaci usred
// partije; 7 dana je kompromis prihvatljiv za opseg ove aplikacije, u kojoj
// token ne otključava nikakve osjetljive radnje osim vlastitog profila.
const jwtSignOptions: JwtSignOptions = {
  expiresIn: (process.env.JWT_EXPIRES_IN ??
    '7d') as JwtSignOptions['expiresIn'],
};

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: jwtSignOptions,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
