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

  const mockRequest = {
    user: {
      userId: 'test-user-id',
      username: 'testuser'
    }
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
    it('should return history items for the authenticated user', async () => {
      const mockHistoryItems = [
        {
          id: '1',
          question: 'What does microsoft.com do?',
          domain: 'microsoft.com',
          answer: 'Microsoft is a technology company',
          timestamp: new Date(),
          userId: 'test-user-id',
        },
      ];

      mockHistoryService.getHistory.mockResolvedValue(mockHistoryItems);

      const result = await controller.getHistory(mockRequest);

      expect(historyService.getHistory).toHaveBeenCalledWith('test-user-id');
      expect(result).toEqual(mockHistoryItems);
    });

    it('should handle empty history for user', async () => {
      mockHistoryService.getHistory.mockResolvedValue([]);

      const result = await controller.getHistory(mockRequest);

      expect(historyService.getHistory).toHaveBeenCalledWith('test-user-id');
      expect(result).toEqual([]);
    });

    it('should handle service errors', async () => {
      const error = new Error('Database connection failed');
      mockHistoryService.getHistory.mockRejectedValue(error);

      await expect(controller.getHistory(mockRequest)).rejects.toThrow('Database connection failed');
      expect(historyService.getHistory).toHaveBeenCalledWith('test-user-id');
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

      const result = await controller.getHistory(mockRequest);

      expect(historyService.getHistory).toHaveBeenCalled();
      expect(result).toEqual(largeHistoryList);
      expect(result).toHaveLength(1000);
    });
  });

  describe('saveHistory', () => {
    it('should save history item for the authenticated user', async () => {
      const saveHistoryDto: SaveHistoryDto = {
        question: 'What does microsoft.com do?',
        domain: 'microsoft.com',
        answer: 'Microsoft is a technology company',
      };

      const mockSavedItem = {
        id: '1',
        ...saveHistoryDto,
        timestamp: new Date(),
        userId: 'test-user-id',
      };

      mockHistoryService.saveHistory.mockResolvedValue(mockSavedItem);

      const result = await controller.saveHistory(saveHistoryDto, mockRequest);

      expect(historyService.saveHistory).toHaveBeenCalledWith(
        saveHistoryDto.question,
        saveHistoryDto.domain,
        saveHistoryDto.answer,
        'test-user-id'
      );
      expect(result).toEqual(mockSavedItem);
    });

    it('should handle empty question', async () => {
      const saveHistoryDto: SaveHistoryDto = {
        question: '',
        domain: 'example.com',
        answer: 'Test answer',
      };

      const mockSavedItem = {
        id: '1',
        ...saveHistoryDto,
        timestamp: new Date(),
        userId: 'test-user-id',
      };

      mockHistoryService.saveHistory.mockResolvedValue(mockSavedItem);

      const result = await controller.saveHistory(saveHistoryDto, mockRequest);

      expect(historyService.saveHistory).toHaveBeenCalledWith('', 'example.com', 'Test answer', 'test-user-id');
      expect(result).toEqual(mockSavedItem);
    });

    it('should handle long question and answer', async () => {
      const longQuestion = 'A'.repeat(1000);
      const longAnswer = 'B'.repeat(2000);
      const saveHistoryDto: SaveHistoryDto = {
        question: longQuestion,
        domain: 'example.com',
        answer: longAnswer,
      };

      const mockSavedItem = {
        id: '1',
        ...saveHistoryDto,
        timestamp: new Date(),
        userId: 'test-user-id',
      };

      mockHistoryService.saveHistory.mockResolvedValue(mockSavedItem);

      const result = await controller.saveHistory(saveHistoryDto, mockRequest);

      expect(historyService.saveHistory).toHaveBeenCalledWith(longQuestion, 'example.com', longAnswer, 'test-user-id');
      expect(result).toEqual(mockSavedItem);
    });

    it('should handle special characters in question and answer', async () => {
      const saveHistoryDto: SaveHistoryDto = {
        question: 'What does microsoft.com do? 🚀',
        domain: 'microsoft.com',
        answer: 'Microsoft is a technology company with special chars: @#$%^&*()',
      };

      const mockSavedItem = {
        id: '1',
        ...saveHistoryDto,
        timestamp: new Date(),
        userId: 'test-user-id',
      };

      mockHistoryService.saveHistory.mockResolvedValue(mockSavedItem);

      const result = await controller.saveHistory(saveHistoryDto, mockRequest);

      expect(historyService.saveHistory).toHaveBeenCalledWith(
        saveHistoryDto.question,
        saveHistoryDto.domain,
        saveHistoryDto.answer,
        'test-user-id'
      );
      expect(result).toEqual(mockSavedItem);
    });

    it('should handle service errors', async () => {
      const saveHistoryDto: SaveHistoryDto = {
        question: 'What does microsoft.com do?',
        domain: 'microsoft.com',
        answer: 'Microsoft is a technology company',
      };

      const error = new Error('Failed to save history');
      mockHistoryService.saveHistory.mockRejectedValue(error);

      await expect(controller.saveHistory(saveHistoryDto, mockRequest)).rejects.toThrow('Failed to save history');
      expect(historyService.saveHistory).toHaveBeenCalledWith(
        saveHistoryDto.question,
        saveHistoryDto.domain,
        saveHistoryDto.answer,
        'test-user-id'
      );
    });

    it('should handle null values', async () => {
      const saveHistoryDto: SaveHistoryDto = {
        question: null as any,
        domain: null as any,
        answer: null as any,
      };

      const mockSavedItem = {
        id: '1',
        ...saveHistoryDto,
        timestamp: new Date(),
        userId: 'test-user-id',
      };

      mockHistoryService.saveHistory.mockResolvedValue(mockSavedItem);

      const result = await controller.saveHistory(saveHistoryDto, mockRequest);

      expect(historyService.saveHistory).toHaveBeenCalledWith(null, null, null, 'test-user-id');
      expect(result).toEqual(mockSavedItem);
    });

    it('should handle undefined values', async () => {
      const saveHistoryDto: SaveHistoryDto = {
        question: undefined as any,
        domain: undefined as any,
        answer: undefined as any,
      };

      const mockSavedItem = {
        id: '1',
        ...saveHistoryDto,
        timestamp: new Date(),
        userId: 'test-user-id',
      };

      mockHistoryService.saveHistory.mockResolvedValue(mockSavedItem);

      const result = await controller.saveHistory(saveHistoryDto, mockRequest);

      expect(historyService.saveHistory).toHaveBeenCalledWith(undefined, undefined, undefined, 'test-user-id');
      expect(result).toEqual(mockSavedItem);
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
          userId: 'test-user-id',
        };

        mockHistoryService.saveHistory.mockResolvedValue(mockSavedItem);

        const result = await controller.saveHistory(saveHistoryDto, mockRequest);

        expect(historyService.saveHistory).toHaveBeenCalledWith(
          testCase.question,
          testCase.domain,
          testCase.answer,
          'test-user-id'
        );
        expect(result).toEqual(mockSavedItem);

        // Reset mocks for next iteration
        jest.clearAllMocks();
      }
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
        userId: 'test-user-id',
      };

      const mockSavedItem2 = {
        id: 2,
        ...saveHistoryDto2,
        timestamp: new Date(),
        userId: 'test-user-id',
      };

      mockHistoryService.saveHistory
        .mockResolvedValueOnce(mockSavedItem1)
        .mockResolvedValueOnce(mockSavedItem2);

      const [result1, result2] = await Promise.all([
        controller.saveHistory(saveHistoryDto1, mockRequest),
        controller.saveHistory(saveHistoryDto2, mockRequest),
      ]);

      expect(historyService.saveHistory).toHaveBeenCalledTimes(2);
      expect(result1).toEqual(mockSavedItem1);
      expect(result2).toEqual(mockSavedItem2);
    });
  });
}); 