import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Controller('questions')
export class QuestionsController {
  constructor(private prisma: PrismaService) {}

  async checkAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('Nemaš pristup.');
    }
  }

  @Get()
  async getQuestions() {
    return this.prisma.question.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  @Post()
  async createQuestion(
    @Body()
    body: {
      userId: string;

      category: string;
      question: string;

      optionA: string;
      optionB: string;
      optionC: string;
      optionD: string;

      correctAnswer: string;
    },
  ) {
    await this.checkAdmin(body.userId);

    return this.prisma.question.create({
      data: {
        category: body.category,
        question: body.question,

        optionA: body.optionA,
        optionB: body.optionB,
        optionC: body.optionC,
        optionD: body.optionD,

        correctAnswer: body.correctAnswer,
      },
    });
  }

  @Delete(':id')
  async deleteQuestion(
    @Param('id') id: string,

    @Body()
    body: {
      userId: string;
    },
  ) {
    await this.checkAdmin(body.userId);

    return this.prisma.question.delete({
      where: {
        id,
      },
    });
  }

  @Patch(':id')
  async updateQuestion(
    @Param('id') id: string,

    @Body()
    body: {
      userId: string;

      category: string;
      question: string;

      optionA: string;
      optionB: string;
      optionC: string;
      optionD: string;

      correctAnswer: string;
    },
  ) {
    await this.checkAdmin(body.userId);

    return this.prisma.question.update({
      where: {
        id,
      },

      data: {
        category: body.category,
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