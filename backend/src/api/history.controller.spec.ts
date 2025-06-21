import { Test, TestingModule } from '@nestjs/testing';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { SaveHistoryDto } from './history.dto';

describe('HistoryController', () => {
  let controller: HistoryController;
  let historyService: HistoryService;

  const mockHistoryService = {
    getHistory: jest.fn(),
    saveHistory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HistoryController],
      providers: [
        {
          provide: HistoryService,
          useValue: mockHistoryService,
        },
      ],
    }).compile();

    controller = module.get<HistoryController>(HistoryController);
    historyService = module.get<HistoryService>(HistoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHistory', () => {
    it('should return history items successfully', async () => {
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

      mockHistoryService.getHistory.mockResolvedValue(mockHistoryItems);

      const result = await controller.getHistory();

      expect(historyService.getHistory).toHaveBeenCalled();
      expect(result).toEqual(mockHistoryItems);
    });

    it('should return empty array when no history exists', async () => {
      mockHistoryService.getHistory.mockResolvedValue([]);

      const result = await controller.getHistory();

      expect(historyService.getHistory).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle service errors', async () => {
      const error = new Error('Database connection failed');
      mockHistoryService.getHistory.mockRejectedValue(error);

      await expect(controller.getHistory()).rejects.toThrow('Database connection failed');
      expect(historyService.getHistory).toHaveBeenCalled();
    });

    it('should handle large history lists', async () => {
      const largeHistoryList = Array.from({ length: 1000 }, (_, index) => ({
        id: index + 1,
        question: `Question ${index + 1}`,
        domain: `domain${index + 1}.com`,
        answer: `Answer ${index + 1}`,
        timestamp: new Date(),
      }));

      mockHistoryService.getHistory.mockResolvedValue(largeHistoryList);

      const result = await controller.getHistory();

      expect(historyService.getHistory).toHaveBeenCalled();
      expect(result).toEqual(largeHistoryList);
      expect(result).toHaveLength(1000);
    });
  });

  describe('saveHistory', () => {
    it('should save history item successfully', async () => {
      const saveHistoryDto: SaveHistoryDto = {
        question: 'What does example.com do?',
        domain: 'example.com',
        answer: 'Example.com is a technology company.',
      };

      const mockSavedItem = {
        id: 1,
        ...saveHistoryDto,
        timestamp: new Date(),
      };

      mockHistoryService.saveHistory.mockResolvedValue(mockSavedItem);

      const result = await controller.saveHistory(saveHistoryDto);

      expect(historyService.saveHistory).toHaveBeenCalledWith(
        saveHistoryDto.question,
        saveHistoryDto.domain,
        saveHistoryDto.answer
      );
      expect(result).toEqual(mockSavedItem);
    });

    it('should handle empty strings in save history', async () => {
      const saveHistoryDto: SaveHistoryDto = {
        question: '',
        domain: '',
        answer: '',
      };

      const mockSavedItem = {
        id: 1,
        ...saveHistoryDto,
        timestamp: new Date(),
      };

      mockHistoryService.saveHistory.mockResolvedValue(mockSavedItem);

      const result = await controller.saveHistory(saveHistoryDto);

      expect(historyService.saveHistory).toHaveBeenCalledWith('', '', '');
      expect(result).toEqual(mockSavedItem);
    });

    it('should handle long strings in save history', async () => {
      const longQuestion = 'A'.repeat(1000);
      const longAnswer = 'B'.repeat(2000);
      const saveHistoryDto: SaveHistoryDto = {
        question: longQuestion,
        domain: 'example.com',
        answer: longAnswer,
      };

      const mockSavedItem = {
        id: 1,
        ...saveHistoryDto,
        timestamp: new Date(),
      };

      mockHistoryService.saveHistory.mockResolvedValue(mockSavedItem);

      const result = await controller.saveHistory(saveHistoryDto);

      expect(historyService.saveHistory).toHaveBeenCalledWith(longQuestion, 'example.com', longAnswer);
      expect(result).toEqual(mockSavedItem);
    });

    it('should handle special characters in save history', async () => {
      const saveHistoryDto: SaveHistoryDto = {
        question: 'What does example.com do? 🚀',
        domain: 'example.com',
        answer: 'Example.com is a technology company! 💻',
      };

      const mockSavedItem = {
        id: 1,
        ...saveHistoryDto,
        timestamp: new Date(),
      };

      mockHistoryService.saveHistory.mockResolvedValue(mockSavedItem);

      const result = await controller.saveHistory(saveHistoryDto);

      expect(historyService.saveHistory).toHaveBeenCalledWith(
        'What does example.com do? 🚀',
        'example.com',
        'Example.com is a technology company! 💻'
      );
      expect(result).toEqual(mockSavedItem);
    });

    it('should handle service errors in save history', async () => {
      const saveHistoryDto: SaveHistoryDto = {
        question: 'What does example.com do?',
        domain: 'example.com',
        answer: 'Example.com is a technology company.',
      };

      const error = new Error('Failed to save history');
      mockHistoryService.saveHistory.mockRejectedValue(error);

      await expect(controller.saveHistory(saveHistoryDto)).rejects.toThrow('Failed to save history');
      expect(historyService.saveHistory).toHaveBeenCalledWith(
        saveHistoryDto.question,
        saveHistoryDto.domain,
        saveHistoryDto.answer
      );
    });

    it('should handle various domain formats in save history', async () => {
      const testCases = [
        {
          question: 'What does https://example.com do?',
          domain: 'example.com',
          answer: 'Example.com is a technology company.',
        },
        {
          question: 'Tell me about www.google.com',
          domain: 'google.com',
          answer: 'Google is a search engine company.',
        },
        {
          question: 'Analyze sub.example.com',
          domain: 'sub.example.com',
          answer: 'Sub.example.com is a subdomain.',
        },
        {
          question: 'What about EXAMPLE.COM?',
          domain: 'example.com',
          answer: 'Example.com is a company.',
        },
      ];

      for (const testCase of testCases) {
        const saveHistoryDto: SaveHistoryDto = {
          question: testCase.question,
          domain: testCase.domain,
          answer: testCase.answer,
        };

        const mockSavedItem = {
          id: 1,
          ...saveHistoryDto,
          timestamp: new Date(),
        };

        mockHistoryService.saveHistory.mockResolvedValue(mockSavedItem);

        const result = await controller.saveHistory(saveHistoryDto);

        expect(historyService.saveHistory).toHaveBeenCalledWith(
          testCase.question,
          testCase.domain,
          testCase.answer
        );
        expect(result).toEqual(mockSavedItem);

        // Reset mocks for next iteration
        jest.clearAllMocks();
      }
    });

    it('should handle null and undefined values gracefully', async () => {
      const saveHistoryDto: SaveHistoryDto = {
        question: 'What does example.com do?',
        domain: 'example.com',
        answer: 'Example.com is a technology company.',
      };

      const mockSavedItem = {
        id: 1,
        ...saveHistoryDto,
        timestamp: new Date(),
      };

      mockHistoryService.saveHistory.mockResolvedValue(mockSavedItem);

      const result = await controller.saveHistory(saveHistoryDto);

      expect(historyService.saveHistory).toHaveBeenCalledWith(
        saveHistoryDto.question,
        saveHistoryDto.domain,
        saveHistoryDto.answer
      );
      expect(result).toEqual(mockSavedItem);
    });

    it('should handle concurrent save requests', async () => {
      const saveHistoryDto1: SaveHistoryDto = {
        question: 'What does example.com do?',
        domain: 'example.com',
        answer: 'Example.com is a technology company.',
      };

      const saveHistoryDto2: SaveHistoryDto = {
        question: 'What does google.com do?',
        domain: 'google.com',
        answer: 'Google is a search engine company.',
      };

      const mockSavedItem1 = {
        id: 1,
        ...saveHistoryDto1,
        timestamp: new Date(),
      };

      const mockSavedItem2 = {
        id: 2,
        ...saveHistoryDto2,
        timestamp: new Date(),
      };

      mockHistoryService.saveHistory
        .mockResolvedValueOnce(mockSavedItem1)
        .mockResolvedValueOnce(mockSavedItem2);

      const [result1, result2] = await Promise.all([
        controller.saveHistory(saveHistoryDto1),
        controller.saveHistory(saveHistoryDto2),
      ]);

      expect(historyService.saveHistory).toHaveBeenCalledTimes(2);
      expect(result1).toEqual(mockSavedItem1);
      expect(result2).toEqual(mockSavedItem2);
    });
  });
}); 