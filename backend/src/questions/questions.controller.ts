import { Body, Controller, Delete, Param, Patch, Get, Post } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';


@Controller('questions')
export class QuestionsController {
  constructor(private prisma: PrismaService) {}

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
      category: string;
      question: string; 
      optionA: string;
      optionB: string; 
      optionC: string;
      optionD: string;
      correctAnswer: string;
    },
  ) {
    return this.prisma.question.create({
      data: body,
    });
  }
  @Delete(':id')
async deleteQuestion(@Param('id') id: string) {
  return this.prisma.question.delete({
    where: { id },
  });
}
@Patch(':id')
async updateQuestion(
  @Param('id') id: string,
  @Body()
  body: {
    category: string;
    question: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: string;
  },
) {
  return this.prisma.question.update({
    where: { id },
    data: body,
  });
}
}

