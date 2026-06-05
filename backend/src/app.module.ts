import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GameGateway } from './game.gateway';
import { PrismaService } from './prisma/prisma.service';
import { LeaderboardController } from './leaderboard/leaderboard.controller';
import { QuestionsController } from './questions/questions.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DailyChallengeModule } from './daily-challenge/daily-challenge.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [

  ThrottlerModule.forRoot([
    {
      ttl: 60000,
      limit: 20,
    },
  ]),
  AuthModule,
  UsersModule,
  DailyChallengeModule,
  JwtModule.register({
  secret: process.env.JWT_SECRET,
  signOptions: {
    expiresIn: '7d',
  },
}),
],
  controllers: [AppController, LeaderboardController, QuestionsController],
  providers: [AppService, GameGateway, PrismaService],
})
export class AppModule {}

