import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GameGateway } from './game.gateway';
import { PrismaService } from './prisma/prisma.service';
import { LeaderboardController } from './leaderboard/leaderboard.controller';
import { QuestionsController } from './questions/questions.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DailyChallengeModule } from './daily-challenge/daily-challenge.module';

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
  ],
  controllers: [AppController, LeaderboardController, QuestionsController],
  providers: [
    AppService,
    GameGateway,
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}