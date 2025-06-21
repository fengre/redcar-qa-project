import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('root', () => {
    it('should return "Company Question Analyzer API is running!"', () => {
      const result = 'Company Question Analyzer API is running!';
      jest.spyOn(appService, 'getHello').mockImplementation(() => result);
      expect(appController.getHello()).toBe(result);
    });
  });

  describe('health', () => {
    it('should return health status with timestamp', () => {
      const healthResponse = appController.getHealth();
      
      expect(healthResponse).toHaveProperty('status');
      expect(healthResponse).toHaveProperty('timestamp');
      expect(healthResponse.status).toBe('ok');
      expect(typeof healthResponse.timestamp).toBe('string');
      expect(new Date(healthResponse.timestamp).getTime()).not.toBeNaN();
    });

    it('should return current timestamp', () => {
      const beforeCall = new Date();
      const healthResponse = appController.getHealth();
      const afterCall = new Date();
      
      const responseTime = new Date(healthResponse.timestamp).getTime();
      const beforeTime = beforeCall.getTime();
      const afterTime = afterCall.getTime();
      
      expect(responseTime).toBeGreaterThanOrEqual(beforeTime);
      expect(responseTime).toBeLessThanOrEqual(afterTime);
    });
  });
}); 