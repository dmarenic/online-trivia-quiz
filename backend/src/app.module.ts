import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GameGateway } from './game.gateway';
import { PrismaService } from './prisma/prisma.service';
import { LeaderboardController } from './leaderboard/leaderboard.controller';

@Module({
  imports: [],
  controllers: [AppController, LeaderboardController],
  providers: [AppService, GameGateway, PrismaService],
})
export class AppModule {}