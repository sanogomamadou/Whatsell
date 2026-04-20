import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(appController).toBeDefined();
  });

  describe('getHealth', () => {
    it('should return health status ok with timestamp', () => {
      const result = appController.getHealth();
      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
      expect(typeof result.timestamp).toBe('string');
    });

    it('should return a valid ISO 8601 UTC timestamp', () => {
      const result = appController.getHealth();
      const date = new Date(result.timestamp);
      expect(date.toISOString()).toBe(result.timestamp);
    });
  });
});
