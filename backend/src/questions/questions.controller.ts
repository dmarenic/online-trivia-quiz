import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { GenerateAiQuestionsDto, QuestionDto } from './dto/question.dto';
import { Throttle } from '@nestjs/throttler';

type GeneratedQuestion = {
  category?: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
};

@Controller('questions')
export class QuestionsController {
  private readonly logger = new Logger(QuestionsController.name);

  private ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
  });

  constructor(private prisma: PrismaService) {}

  private validateCorrectAnswer(body: QuestionDto) {
    const options = [body.optionA, body.optionB, body.optionC, body.optionD];

    if (!options.includes(body.correctAnswer)) {
      throw new BadRequestException(
        'Točan odgovor mora biti jednak jednoj od ponuđenih opcija.',
      );
    }
  }

  // GenerateAiQuestionsDto dopušta i hrvatske nazive težina, a baza i filter
  // sobe koriste isključivo easy/medium/hard — zato se vrijednost normalizira
  // prije spremanja.
  private normalizeDifficulty(difficulty: string) {
    const difficultyMap: Record<string, string> = {
      lagano: 'easy',
      srednje: 'medium',
      teško: 'hard',
    };

    return difficultyMap[difficulty] ?? difficulty;
  }

  @Get()
  async getQuestions() {
    return this.prisma.question.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        category: true,
        question: true,
        optionA: true,
        optionB: true,
        optionC: true,
        optionD: true,
        createdAt: true,
      },
    });
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin')
  async getAdminQuestions() {
    return this.prisma.question.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('ai/models')
  async listGeminiModels() {
    const models = await this.ai.models.list();

    const result: {
      name?: string;
      supportedActions?: string[];
    }[] = [];

    for await (const model of models) {
      result.push({
        name: model.name,
        supportedActions: model.supportedActions,
      });
    }

    return result;
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('generate-ai')
  async generateAiQuestions(@Body() body: GenerateAiQuestionsDto) {
    const count = Math.min(Math.max(Number(body.count) || 5, 1), 20);

    try {
      const response = await this.ai.models.generateContent({
        model: 'models/gemini-2.5-flash',
        contents: `
Generiraj točno ${count} kviz pitanja na hrvatskom jeziku.

Tema: ${body.topic}
Kategorija: ${body.category}
Težina: ${body.difficulty}

Vrati SAMO validan JSON array.
Bez markdowna.
Bez objašnjenja.
Bez dodatnog teksta.

Svaki objekt mora imati ovu strukturu:
{
  "category": "${body.category}",
  "question": "Tekst pitanja",
  "optionA": "Odgovor A",
  "optionB": "Odgovor B",
  "optionC": "Odgovor C",
  "optionD": "Odgovor D",
  "correctAnswer": "točan odgovor koji je identičan jednom od ponuđenih odgovora"
}

Pravila:
- correctAnswer mora biti potpuno isti tekst kao jedan od optionA, optionB, optionC ili optionD.
- Pitanja moraju biti jasna.
- Ne smije biti duplikata.
- Ne koristi šale ili neozbiljne odgovore.
`,
      });

      // Gemini povremeno vrati JSON u markdown bloku (```json ... ```) iako je
      // u promptu zabranjen, pa se ograde skidaju prije parsiranja. Model nije
      // pouzdan izvor podataka: ako parsiranje padne, korisnik dobiva poruku
      // umjesto iznimke, a uspješno parsirana pitanja se dodatno filtriraju
      // (sva polja popunjena + correctAnswer mora biti jedna od ponuđenih
      // opcija) jer scoring logika ovisi o tom invarijantu.
      const rawText = response.text ?? '';

      const cleanedText = rawText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      let generatedQuestions: GeneratedQuestion[];

      try {
        // Sirovi odgovor modela ostaje samo u logu — vraćanje klijentu bilo bi
        // nepotrebno izlaganje internih detalja providera.
        generatedQuestions = JSON.parse(cleanedText) as GeneratedQuestion[];
      } catch {
        this.logger.warn(
          `Gemini nije vratio ispravan JSON. Odgovor: ${rawText.slice(0, 500)}`,
        );

        return {
          success: false,
          message: 'Gemini nije vratio ispravan JSON. Pokušaj ponovno.',
        };
      }

      const validQuestions = generatedQuestions
        .map((question) => ({
          category: body.category,
          difficulty: this.normalizeDifficulty(body.difficulty),
          question: question.question,
          optionA: question.optionA,
          optionB: question.optionB,
          optionC: question.optionC,
          optionD: question.optionD,
          correctAnswer: question.correctAnswer,
        }))
        .filter((question) => {
          const options = [
            question.optionA,
            question.optionB,
            question.optionC,
            question.optionD,
          ];

          return (
            question.category &&
            question.question &&
            question.optionA &&
            question.optionB &&
            question.optionC &&
            question.optionD &&
            question.correctAnswer &&
            options.includes(question.correctAnswer)
          );
        });

      if (validQuestions.length === 0) {
        return {
          success: false,
          message: 'Gemini nije generirao valjana pitanja. Pokušaj ponovno.',
        };
      }

      await this.prisma.question.createMany({
        data: validQuestions,
        skipDuplicates: true,
      });

      return {
        success: true,
        message: `Generirano i spremljeno ${validQuestions.length} pitanja.`,
        questions: validQuestions,
      };
    } catch (error) {
      // Detalj greške (ključ, kvota, model) ide isključivo u server log;
      // klijent dobiva generičku poruku.
      this.logger.error('Gemini generiranje pitanja nije uspjelo', error);

      return {
        success: false,
        message: 'Gemini API trenutno nije dostupan. Pokušaj ponovno kasnije.',
      };
    }
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  async createQuestion(@Body() body: QuestionDto) {
    this.validateCorrectAnswer(body);
    return this.prisma.question.create({
      data: {
        category: body.category,
        difficulty: body.difficulty,
        question: body.question,
        optionA: body.optionA,
        optionB: body.optionB,
        optionC: body.optionC,
        optionD: body.optionD,
        correctAnswer: body.correctAnswer,
      },
    });
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  async deleteQuestion(@Param('id') id: string) {
    return this.prisma.question.delete({
      where: {
        id,
      },
    });
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id')
  async updateQuestion(@Param('id') id: string, @Body() body: QuestionDto) {
    this.validateCorrectAnswer(body);
    return this.prisma.question.update({
      where: {
        id,
      },
      data: {
        category: body.category,
        difficulty: body.difficulty,
        question: body.question,
        optionA: body.optionA,
        optionB: body.optionB,
        optionC: body.optionC,
        optionD: body.optionD,
        correctAnswer: body.correctAnswer,
      },
    });
  }
}
