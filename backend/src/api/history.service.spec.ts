import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistoryService } from './history.service';
import { HistoryItem } from './history.entity';

describe('HistoryService', () => {
  let service: HistoryService;
  let repository: Repository<HistoryItem>;

  const mockRepository = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HistoryService,
        {
          provide: getRepositoryToken(HistoryItem),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<HistoryService>(HistoryService);
    repository = module.get<Repository<HistoryItem>>(getRepositoryToken(HistoryItem));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHistory', () => {
    it('should return history items for a user', async () => {
      const userId = 'test-user-id';
      const mockHistoryItems = [
        {
          id: '1',
          question: 'What does microsoft.com do?',
          domain: 'microsoft.com',
          answer: 'Microsoft is a technology company',
          timestamp: new Date(),
          userId: userId,
        },
      ];

      mockRepository.find.mockResolvedValue(mockHistoryItems);

      const result = await service.getHistory(userId);

      expect(repository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { timestamp: 'DESC' },
      });
      expect(result).toEqual(mockHistoryItems);
    });

    it('should return empty array when no history exists for user', async () => {
      const userId = 'test-user-id';
      mockRepository.find.mockResolvedValue([]);

      const result = await service.getHistory(userId);

      expect(repository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { timestamp: 'DESC' },
      });
      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      const userId = 'test-user-id';
      const error = new Error('Database connection failed');
      mockRepository.find.mockRejectedValue(error);

      await expect(service.getHistory(userId)).rejects.toThrow('Database connection failed');
      expect(repository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { timestamp: 'DESC' },
      });
    });

    it('should handle large history lists', async () => {
      const userId = 'test-user-id';
      const largeHistoryList = Array.from({ length: 100 }, (_, i) => ({
        id: `${i + 1}`,
        question: `Question ${i + 1}`,
        domain: `example${i + 1}.com`,
        answer: `Answer ${i + 1}`,
        timestamp: new Date(),
        userId: userId,
      }));

      mockRepository.find.mockResolvedValue(largeHistoryList);

      const result = await service.getHistory(userId);

      expect(repository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { timestamp: 'DESC' },
      });
      expect(result).toHaveLength(100);
      expect(result).toEqual(largeHistoryList);
    });
  });

  describe('saveHistory', () => {
    it('should save history item successfully', async () => {
      const question = 'What does microsoft.com do?';
      const domain = 'microsoft.com';
      const answer = 'Microsoft is a technology company';
      const userId = 'test-user-id';

      const mockHistoryItem = {
        id: '1',
        question,
        domain,
        answer,
        timestamp: new Date(),
        userId,
      };

      mockRepository.create.mockReturnValue(mockHistoryItem);
      mockRepository.save.mockResolvedValue(mockHistoryItem);

      const result = await service.saveHistory(question, domain, answer, userId);

      expect(repository.create).toHaveBeenCalledWith({
        question,
        domain,
        answer,
        userId,
      });
      expect(repository.save).toHaveBeenCalledWith(mockHistoryItem);
      expect(result).toEqual(mockHistoryItem);
    });

    it('should handle empty strings', async () => {
      const question = '';
      const domain = 'example.com';
      const answer = 'Test answer';
      const userId = 'test-user-id';

      const mockHistoryItem = {
        id: '1',
        question,
        domain,
        answer,
        timestamp: new Date(),
        userId,
      };

      mockRepository.create.mockReturnValue(mockHistoryItem);
      mockRepository.save.mockResolvedValue(mockHistoryItem);

      const result = await service.saveHistory(question, domain, answer, userId);

      expect(repository.create).toHaveBeenCalledWith({
        question,
        domain,
        answer,
        userId,
      });
      expect(repository.save).toHaveBeenCalledWith(mockHistoryItem);
      expect(result).toEqual(mockHistoryItem);
    });

    it('should handle long strings', async () => {
      const question = 'A'.repeat(1000);
      const domain = 'example.com';
      const answer = 'B'.repeat(2000);
      const userId = 'test-user-id';

      const mockHistoryItem = {
        id: '1',
        question,
        domain,
        answer,
        timestamp: new Date(),
        userId,
      };

      mockRepository.create.mockReturnValue(mockHistoryItem);
      mockRepository.save.mockResolvedValue(mockHistoryItem);

      const result = await service.saveHistory(question, domain, answer, userId);

      expect(repository.create).toHaveBeenCalledWith({
        question,
        domain,
        answer,
        userId,
      });
      expect(repository.save).toHaveBeenCalledWith(mockHistoryItem);
      expect(result).toEqual(mockHistoryItem);
    });

    it('should handle special characters', async () => {
      const question = 'What does microsoft.com do? 🚀';
      const domain = 'microsoft.com';
      const answer = 'Microsoft is a technology company with special chars: @#$%^&*()';
      const userId = 'test-user-id';

      const mockHistoryItem = {
        id: '1',
        question,
        domain,
        answer,
        timestamp: new Date(),
        userId,
      };

      mockRepository.create.mockReturnValue(mockHistoryItem);
      mockRepository.save.mockResolvedValue(mockHistoryItem);

      const result = await service.saveHistory(question, domain, answer, userId);

      expect(repository.create).toHaveBeenCalledWith({
        question,
        domain,
        answer,
        userId,
      });
      expect(repository.save).toHaveBeenCalledWith(mockHistoryItem);
      expect(result).toEqual(mockHistoryItem);
    });

    it('should handle create errors', async () => {
      const question = 'What does microsoft.com do?';
      const domain = 'microsoft.com';
      const answer = 'Microsoft is a technology company';
      const userId = 'test-user-id';

      const error = new Error('Failed to create history item');
      mockRepository.create.mockImplementation(() => {
        throw error;
      });

      await expect(service.saveHistory(question, domain, answer, userId)).rejects.toThrow('Failed to create history item');
      expect(repository.create).toHaveBeenCalledWith({
        question,
        domain,
        answer,
        userId,
      });
    });

    it('should handle save errors', async () => {
      const question = 'What does microsoft.com do?';
      const domain = 'microsoft.com';
      const answer = 'Microsoft is a technology company';
      const userId = 'test-user-id';

      const mockHistoryItem = {
        id: '1',
        question,
        domain,
        answer,
        timestamp: new Date(),
        userId,
      };

      mockRepository.create.mockReturnValue(mockHistoryItem);
      const error = new Error('Failed to save history item');
      mockRepository.save.mockRejectedValue(error);

      await expect(service.saveHistory(question, domain, answer, userId)).rejects.toThrow('Failed to save history item');
      expect(repository.create).toHaveBeenCalledWith({
        question,
        domain,
        answer,
        userId,
      });
      expect(repository.save).toHaveBeenCalledWith(mockHistoryItem);
    });

    it('should handle null values', async () => {
      const question = null as any;
      const domain = null as any;
      const answer = null as any;
      const userId = 'test-user-id';

      const mockHistoryItem = {
        id: '1',
        question,
        domain,
        answer,
        timestamp: new Date(),
        userId,
      };

      mockRepository.create.mockReturnValue(mockHistoryItem);
      mockRepository.save.mockResolvedValue(mockHistoryItem);

      const result = await service.saveHistory(question, domain, answer, userId);

      expect(repository.create).toHaveBeenCalledWith({
        question,
        domain,
        answer,
        userId,
      });
      expect(repository.save).toHaveBeenCalledWith(mockHistoryItem);
      expect(result).toEqual(mockHistoryItem);
    });

    it('should handle undefined values', async () => {
      const question = undefined as any;
      const domain = undefined as any;
      const answer = undefined as any;
      const userId = 'test-user-id';

      const mockHistoryItem = {
        id: '1',
        question,
        domain,
        answer,
        timestamp: new Date(),
        userId,
      };

      mockRepository.create.mockReturnValue(mockHistoryItem);
      mockRepository.save.mockResolvedValue(mockHistoryItem);

      const result = await service.saveHistory(question, domain, answer, userId);

      expect(repository.create).toHaveBeenCalledWith({
        question,
        domain,
        answer,
        userId,
      });
      expect(repository.save).toHaveBeenCalledWith(mockHistoryItem);
      expect(result).toEqual(mockHistoryItem);
    });
  });
}); 