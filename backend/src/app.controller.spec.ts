import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('vraća status aplikacije', () => {
      expect(appController.getHello()).toEqual({
        status: 'ok',
        app: 'trivia-api',
      });
    });
  });
});
