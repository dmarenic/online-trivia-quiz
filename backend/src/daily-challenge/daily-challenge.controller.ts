import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { QUIZ_CATEGORIES } from '../questions/categories';
import { SubmitDailyDto } from './dto/submit-daily.dto';

// Cijeli daily modul računa "danas" kao UTC kalendarski dan. To je definicija
// koju već nameće baza: DailyChallenge.date je unique string "YYYY-MM-DD"
// izveden iz toISOString(), pa i dnevni leaderboard mora koristiti istu granicu
// dana — inače bi na poslužitelju izvan UTC-a prikazivao rezultate iz krivog
// dana u odnosu na izazov koji se tog trenutka igra.
export function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

export function getTodayStart() {
  return new Date(`${getTodayKey()}T00:00:00.000Z`);
}

// Deterministički generator pseudoslučajnih brojeva (mulberry32). Za isto
// sjeme uvijek daje isti niz vrijednosti, za razliku od Math.random().
function createSeededRandom(seed: number) {
  let state = seed;

  return () => {
    state = (state + 0x6d2b79f5) | 0;

    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Datum "YYYY-MM-DD" pretvara u cjelobrojno sjeme (varijanta djb2/Java hasha).
function getDateSeed(date: string) {
  let hash = 0;

  for (let i = 0; i < date.length; i++) {
    hash = (Math.imul(hash, 31) + date.charCodeAt(i)) | 0;
  }

  return hash >>> 0;
}

// Izbor pitanja za dnevni izazov mora biti isti za sve igrače i kroz cijeli
// dan, ali različit iz dana u dan. Zato se ne koristi Math.random (svaki bi
// zahtjev dao drugi set) niti puko `take` bez sortiranja (uvijek isti set):
// popis se sortira stabilno po id-u, pa promiješa Fisher-Yatesom čiji je
// izvor slučajnosti izveden isključivo iz datuma izazova.
function pickDailyQuestions<T extends { id: string }>(
  questions: T[],
  date: string,
  count: number,
) {
  const ordered = [...questions].sort((a, b) => a.id.localeCompare(b.id));
  const random = createSeededRandom(getDateSeed(date));

  for (let i = ordered.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
  }

  return ordered.slice(0, count);
}

@Controller('daily-challenge')
export class DailyChallengeController {
  constructor(private prisma: PrismaService) {}

  @Get('leaderboard')
  async getDailyLeaderboard() {
    const today = getTodayStart();

    return this.prisma.gameResult.findMany({
      where: {
        mode: 'daily',
        createdAt: {
          gte: today,
        },
      },
      orderBy: {
        score: 'desc',
      },
      take: 10,
      include: {
        user: {
          select: {
            username: true,
            avatar: true,
          },
        },
      },
    });
  }

  @Get()
  async getTodayChallenge() {
    const today = getTodayKey();

    let challenge = await this.prisma.dailyChallenge.findUnique({
      where: {
        date: today,
      },
    });

    if (!challenge) {
      // Rotacija kategorija po danima: broj dana od fiksne referentne točke
      // modulo broj kategorija. Zbog fiksne epohe je determinističan — isti
      // datum uvijek daje istu kategoriju, neovisno o tome kada je izazov prvi
      // put zatražen ili je li server u međuvremenu restartan.
      const startDate = new Date('2025-01-01');
      const currentDate = new Date(today);

      const daysPassed = Math.floor(
        (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      const category = QUIZ_CATEGORIES[daysPassed % QUIZ_CATEGORIES.length];

      // upsert umjesto create: dva paralelna zahtjeva za isti datum oba prođu
      // findUnique provjeru iznad, pa bi drugom create pao na unique ograničenju
      // DailyChallenge.date i vratio HTTP 500. Uz upsert oba dobiju isti izazov,
      // a za datum i dalje postoji točno jedan zapis.
      challenge = await this.prisma.dailyChallenge.upsert({
        where: {
          date: today,
        },
        update: {},
        create: {
          title: `Daily ${category} Challenge`,
          description: `Odgovori na 5 pitanja iz kategorije ${category}.`,
          targetScore: 3000,
          category,
          questionCount: 5,
          date: today,
        },
      });
    }

    return challenge;
  }

  @UseGuards(JwtAuthGuard)
  @Get('status/me')
  async getDailyStatus(@CurrentUser() user: AuthenticatedUser) {
    const userId = user.id;
    const today = getTodayKey();

    const challenge = await this.prisma.dailyChallenge.findUnique({
      where: {
        date: today,
      },
    });

    if (!challenge) {
      return {
        played: false,
        completed: false,
      };
    }

    const attempt = await this.prisma.dailyChallengeAttempt.findFirst({
      where: {
        userId,
        challengeId: challenge.id,
      },
    });

    return {
      played: !!attempt,
      completed: attempt?.completed ?? false,
    };
  }

  @Get(':id/questions')
  async getDailyQuestions(@Param('id') id: string) {
    const challenge = await this.prisma.dailyChallenge.findUnique({
      where: {
        id,
      },
    });

    if (!challenge) {
      return [];
    }

    const categoryQuestions = await this.prisma.question.findMany({
      where: {
        category: challenge.category,
      },
      select: {
        id: true,
        category: true,
        question: true,
        optionA: true,
        optionB: true,
        optionC: true,
        optionD: true,
      },
    });

    const questions = pickDailyQuestions(
      categoryQuestions,
      challenge.date,
      challenge.questionCount,
    );

    return questions.map((question) => ({
      id: question.id,
      category: question.category,
      question: question.question,
      options: [
        question.optionA,
        question.optionB,
        question.optionC,
        question.optionD,
      ],
    }));
  }

  @UseGuards(JwtAuthGuard)
  @Post('submit')
  async submitDailyResult(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: SubmitDailyDto,
  ) {
    const userId = user.id;
    const today = getTodayKey();

    const challenge = await this.prisma.dailyChallenge.findUnique({
      where: {
        date: today,
      },
    });

    if (!challenge) {
      return {
        success: false,
        message: 'Daily challenge ne postoji.',
      };
    }

    const uniqueAnswers = Array.from(
      new Map(
        body.answers.map((answer) => [answer.questionId, answer]),
      ).values(),
    );

    const questionIds = uniqueAnswers.map((answer) => answer.questionId);

    const questions = await this.prisma.question.findMany({
      where: {
        id: {
          in: questionIds,
        },
        category: challenge.category,
      },
    });

    let correctAnswers = 0;

    for (const answer of uniqueAnswers) {
      const question = questions.find((q) => q.id === answer.questionId);

      if (question && question.correctAnswer === answer.answer) {
        correctAnswers++;
      }
    }

    // Daily izazov se boduje bez bonusa na brzinu (1000 bodova po točnom
    // odgovoru) jer se igra sam, bez natjecanja u realnom vremenu. Izazov je
    // "ispunjen" kad score dosegne challenge.targetScore.
    // totalQuestions je broj pitanja koje je server prepoznao kao valjana za
    // ovaj izazov, a ne broj odgovora koje je klijent poslao.
    const totalQuestions = questions.length;
    const score = correctAnswers * 1000;

    if (totalQuestions === 0) {
      return {
        success: false,
        message: 'Nema valjanih pitanja za ovaj daily challenge.',
      };
    }

    // Provjera "već igrano danas" i upis rezultata izvode se u jednoj
    // transakciji: bez toga bi dva paralelna zahtjeva oba prošla provjeru i
    // upisala dva rezultata. Dodatnu, konačnu garanciju daje unique ograničenje
    // @@unique([userId, challengeId]) na DailyChallengeAttempt u schema.prisma.
    const result = await this.prisma.$transaction(async (tx) => {
      const alreadyAttempted = await tx.dailyChallengeAttempt.findFirst({
        where: {
          userId,
          challengeId: challenge.id,
        },
      });

      if (alreadyAttempted) {
        return {
          success: true,
          completed: alreadyAttempted.completed,
          rewardClaimed: false,
          score: alreadyAttempted.score,
          correctAnswers: alreadyAttempted.correctAnswers,
          totalQuestions: alreadyAttempted.totalQuestions,
          message: 'Daily challenge si već igrao danas.',
        };
      }

      await tx.gameResult.create({
        data: {
          nickname: body.nickname,
          score,
          correctAnswers,
          totalQuestions,
          userId,
          mode: 'daily',
        },
      });

      await tx.dailyChallengeAttempt.create({
        data: {
          userId,
          challengeId: challenge.id,
          score,
          correctAnswers,
          totalQuestions,
          completed: score >= challenge.targetScore,
        },
      });

      if (score < challenge.targetScore) {
        return {
          success: true,
          completed: false,
          rewardClaimed: false,
          score,
          correctAnswers,
          totalQuestions,
          message: 'Nisi ispunio daily challenge.',
        };
      }

      return {
        success: true,
        completed: true,
        rewardClaimed: true,
        score,
        correctAnswers,
        totalQuestions,
        message: 'Daily challenge završen!',
      };
    });

    return result;
  }
}
