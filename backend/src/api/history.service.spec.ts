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
    it('should return history items ordered by timestamp desc', async () => {
      const mockHistoryItems = [
        {
          id: 1,
          question: 'What does example.com do?',
          domain: 'example.com',
          answer: 'Example.com is a technology company.',
          timestamp: new Date('2023-01-02'),
        },
        {
          id: 2,
          question: 'Tell me about google.com',
          domain: 'google.com',
          answer: 'Google is a search engine company.',
          timestamp: new Date('2023-01-01'),
        },
      ];

      mockRepository.find.mockResolvedValue(mockHistoryItems);

      const result = await service.getHistory();

      expect(repository.find).toHaveBeenCalledWith({
        order: { timestamp: 'DESC' },
      });
      expect(result).toEqual(mockHistoryItems);
    });

    it('should return empty array when no history exists', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.getHistory();

      expect(repository.find).toHaveBeenCalledWith({
        order: { timestamp: 'DESC' },
      });
      expect(result).toEqual([]);
    });

    it('should handle repository errors', async () => {
      const error = new Error('Database connection failed');
      mockRepository.find.mockRejectedValue(error);

      await expect(service.getHistory()).rejects.toThrow('Database connection failed');
      expect(repository.find).toHaveBeenCalledWith({
        order: { timestamp: 'DESC' },
      });
    });
  });

  describe('saveHistory', () => {
    it('should save history item successfully', async () => {
      const question = 'What does example.com do?';
      const domain = 'example.com';
      const answer = 'Example.com is a technology company.';

      const mockHistoryItem = {
        id: 1,
        question,
        domain,
        answer,
        timestamp: new Date(),
      };

      const mockCreatedItem = {
        question,
        domain,
        answer,
      };

      mockRepository.create.mockReturnValue(mockCreatedItem);
      mockRepository.save.mockResolvedValue(mockHistoryItem);

      const result = await service.saveHistory(question, domain, answer);

      expect(repository.create).toHaveBeenCalledWith({
        question,
        domain,
        answer,
      });
      expect(repository.save).toHaveBeenCalledWith(mockCreatedItem);
      expect(result).toEqual(mockHistoryItem);
    });

    it('should handle empty strings', async () => {
      const question = '';
      const domain = '';
      const answer = '';

      const mockHistoryItem = {
        id: 1,
        question,
        domain,
        answer,
        timestamp: new Date(),
      };

      const mockCreatedItem = {
        question,
        domain,
        answer,
      };

      mockRepository.create.mockReturnValue(mockCreatedItem);
      mockRepository.save.mockResolvedValue(mockHistoryItem);

      const result = await service.saveHistory(question, domain, answer);

      expect(repository.create).toHaveBeenCalledWith({
        question,
        domain,
        answer,
      });
      expect(repository.save).toHaveBeenCalledWith(mockCreatedItem);
      expect(result).toEqual(mockHistoryItem);
    });

    it('should handle long strings', async () => {
      const question = 'A'.repeat(1000);
      const domain = 'example.com';
      const answer = 'B'.repeat(2000);

      const mockHistoryItem = {
        id: 1,
        question,
        domain,
        answer,
        timestamp: new Date(),
      };

      const mockCreatedItem = {
        question,
        domain,
        answer,
      };

      mockRepository.create.mockReturnValue(mockCreatedItem);
      mockRepository.save.mockResolvedValue(mockHistoryItem);

      const result = await service.saveHistory(question, domain, answer);

      expect(repository.create).toHaveBeenCalledWith({
        question,
        domain,
        answer,
      });
      expect(repository.save).toHaveBeenCalledWith(mockCreatedItem);
      expect(result).toEqual(mockHistoryItem);
    });

    it('should handle special characters', async () => {
      const question = 'What does example.com do? 🚀';
      const domain = 'example.com';
      const answer = 'Example.com is a technology company! 💻';

      const mockHistoryItem = {
        id: 1,
        question,
        domain,
        answer,
        timestamp: new Date(),
      };

      const mockCreatedItem = {
        question,
        domain,
        answer,
      };

      mockRepository.create.mockReturnValue(mockCreatedItem);
      mockRepository.save.mockResolvedValue(mockHistoryItem);

      const result = await service.saveHistory(question, domain, answer);

      expect(repository.create).toHaveBeenCalledWith({
        question,
        domain,
        answer,
      });
      expect(repository.save).toHaveBeenCalledWith(mockCreatedItem);
      expect(result).toEqual(mockHistoryItem);
    });

    it('should handle repository create errors', async () => {
      const question = 'What does example.com do?';
      const domain = 'example.com';
      const answer = 'Example.com is a technology company.';

      const error = new Error('Failed to create history item');
      mockRepository.create.mockImplementation(() => {
        throw error;
      });

      await expect(service.saveHistory(question, domain, answer)).rejects.toThrow('Failed to create history item');
      expect(repository.create).toHaveBeenCalledWith({
        question,
        domain,
        answer,
      });
    });

    it('should handle repository save errors', async () => {
      const question = 'What does example.com do?';
      const domain = 'example.com';
      const answer = 'Example.com is a technology company.';

      const mockCreatedItem = {
        question,
        domain,
        answer,
      };

      const error = new Error('Failed to save history item');
      mockRepository.create.mockReturnValue(mockCreatedItem);
      mockRepository.save.mockRejectedValue(error);

      await expect(service.saveHistory(question, domain, answer)).rejects.toThrow('Failed to save history item');
      expect(repository.create).toHaveBeenCalledWith({
        question,
        domain,
        answer,
      });
      expect(repository.save).toHaveBeenCalledWith(mockCreatedItem);
    });
  });
}); 