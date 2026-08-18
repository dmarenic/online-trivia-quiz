import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { GameGateway } from './game.gateway';
import { PrismaModule } from './prisma/prisma.module';
import { QuestionsController } from './questions/questions.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DailyChallengeModule } from './daily-challenge/daily-challenge.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    // Globalni rate limit: 20 zahtjeva u minuti po IP-u. Pojedine rute ga
    // pooštravaju vlastitim @Throttle dekoratorom (npr. prijava, AI generiranje).
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 20,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    DailyChallengeModule,
  ],
  controllers: [AppController, QuestionsController, HealthController],
  providers: [
    GameGateway,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
