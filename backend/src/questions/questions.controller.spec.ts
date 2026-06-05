import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsController } from './questions.controller';
import { PrismaService } from '../prisma/prisma.service';

describe('QuestionsController', () => {
  let controller: QuestionsController;

  const prismaMock = {
    question: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      createMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestionsController],
      providers: [
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    controller = module.get<QuestionsController>(QuestionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});