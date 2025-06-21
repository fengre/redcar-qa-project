import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHello', () => {
    it('should return the correct greeting message', () => {
      const result = service.getHello();
      expect(result).toBe('Company Question Analyzer API is running!');
    });

    it('should return a string', () => {
      const result = service.getHello();
      expect(typeof result).toBe('string');
    });

    it('should return a non-empty string', () => {
      const result = service.getHello();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return consistent result on multiple calls', () => {
      const result1 = service.getHello();
      const result2 = service.getHello();
      const result3 = service.getHello();
      
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
      expect(result1).toBe(result3);
    });
  });
}); 