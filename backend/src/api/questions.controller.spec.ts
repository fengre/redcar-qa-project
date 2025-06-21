import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsController } from './questions.controller';
import { DomainService } from './domain.service';
import { MultiStepProcessor } from '../ai/multi-step.processor';
import { BadRequestException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

describe('QuestionsController', () => {
  let controller: QuestionsController;
  let mockDomainService: jest.Mocked<DomainService>;
  let mockMultiStepProcessor: jest.Mocked<MultiStepProcessor>;
  let mockResponse: jest.Mocked<Response>;
  let consoleErrorSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    // Suppress expected error logs during tests
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestionsController],
      providers: [
        {
          provide: DomainService,
          useValue: {
            extractDomain: jest.fn(),
            validateDomain: jest.fn(),
          },
        },
        {
          provide: MultiStepProcessor,
          useValue: {
            process: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<QuestionsController>(QuestionsController);
    mockDomainService = module.get(DomainService);
    mockMultiStepProcessor = module.get(MultiStepProcessor);
    mockResponse = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      write: jest.fn(),
      end: jest.fn(),
      json: jest.fn(),
    } as any;
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    loggerErrorSpy.mockRestore();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('analyzeQuestion', () => {
    it('should successfully analyze a question with valid domain', async () => {
      const analyzeDto = {
        question: 'What does example.com do?',
      };

      mockDomainService.extractDomain.mockReturnValue('example.com');
      mockDomainService.validateDomain.mockReturnValue(true);

      const mockStreamGenerator = (async function* () {
        yield 'Example.com is a technology company.';
      })();
      mockMultiStepProcessor.process.mockReturnValue(mockStreamGenerator);

      await controller.analyzeQuestion(analyzeDto, mockResponse);

      expect(mockDomainService.extractDomain).toHaveBeenCalledWith('What does example.com do?');
      expect(mockDomainService.validateDomain).toHaveBeenCalledWith('example.com');
      expect(mockMultiStepProcessor.process).toHaveBeenCalledWith('What does example.com do?', 'example.com');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Transfer-Encoding', 'chunked');
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.write).toHaveBeenCalledWith('Example.com is a technology company.');
      expect(mockResponse.end).toHaveBeenCalled();
    });

    it('should handle multiple chunks in streaming response', async () => {
      const analyzeDto = {
        question: 'What does example.com do?',
      };

      mockDomainService.extractDomain.mockReturnValue('example.com');
      mockDomainService.validateDomain.mockReturnValue(true);

      const mockStreamGenerator = (async function* () {
        yield 'Example.com ';
        yield 'is a technology ';
        yield 'company.';
      })();
      mockMultiStepProcessor.process.mockReturnValue(mockStreamGenerator);

      await controller.analyzeQuestion(analyzeDto, mockResponse);

      expect(mockResponse.write).toHaveBeenCalledWith('Example.com ');
      expect(mockResponse.write).toHaveBeenCalledWith('is a technology ');
      expect(mockResponse.write).toHaveBeenCalledWith('company.');
      expect(mockResponse.end).toHaveBeenCalled();
    });

    it('should throw BadRequestException when no domain is found', async () => {
      const analyzeDto = {
        question: 'What is the weather like?',
      };

      mockDomainService.extractDomain.mockReturnValue(null);

      await expect(controller.analyzeQuestion(analyzeDto, mockResponse)).rejects.toThrow(
        new BadRequestException('Please include a company domain in your question')
      );

      expect(mockDomainService.extractDomain).toHaveBeenCalledWith('What is the weather like?');
      expect(mockDomainService.validateDomain).not.toHaveBeenCalled();
      expect(mockMultiStepProcessor.process).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when domain format is invalid', async () => {
      const analyzeDto = {
        question: 'What does invalid-domain do?',
      };

      mockDomainService.extractDomain.mockReturnValue('invalid-domain');
      mockDomainService.validateDomain.mockReturnValue(false);

      await expect(controller.analyzeQuestion(analyzeDto, mockResponse)).rejects.toThrow(
        new BadRequestException('Invalid domain format')
      );

      expect(mockDomainService.extractDomain).toHaveBeenCalledWith('What does invalid-domain do?');
      expect(mockDomainService.validateDomain).toHaveBeenCalledWith('invalid-domain');
      expect(mockMultiStepProcessor.process).not.toHaveBeenCalled();
    });

    it('should handle empty question', async () => {
      const analyzeDto = {
        question: '',
      };

      mockDomainService.extractDomain.mockReturnValue(null);

      await expect(controller.analyzeQuestion(analyzeDto, mockResponse)).rejects.toThrow(
        new BadRequestException('Please include a company domain in your question')
      );

      expect(mockDomainService.extractDomain).toHaveBeenCalledWith('');
    });

    it('should handle question with special characters', async () => {
      const analyzeDto = {
        question: 'What does example.com do? 🚀',
      };

      mockDomainService.extractDomain.mockReturnValue('example.com');
      mockDomainService.validateDomain.mockReturnValue(true);

      const mockStreamGenerator = (async function* () {
        yield 'Example.com is a technology company! 💻';
      })();
      mockMultiStepProcessor.process.mockReturnValue(mockStreamGenerator);

      await controller.analyzeQuestion(analyzeDto, mockResponse);

      expect(mockDomainService.extractDomain).toHaveBeenCalledWith('What does example.com do? 🚀');
      expect(mockMultiStepProcessor.process).toHaveBeenCalledWith('What does example.com do? 🚀', 'example.com');
      expect(mockResponse.write).toHaveBeenCalledWith('Example.com is a technology company! 💻');
    });

    it('should handle long question', async () => {
      const longQuestion = 'A'.repeat(1000);
      const analyzeDto = {
        question: longQuestion,
      };

      mockDomainService.extractDomain.mockReturnValue('example.com');
      mockDomainService.validateDomain.mockReturnValue(true);

      const mockStreamGenerator = (async function* () {
        yield 'Long answer.';
      })();
      mockMultiStepProcessor.process.mockReturnValue(mockStreamGenerator);

      await controller.analyzeQuestion(analyzeDto, mockResponse);

      expect(mockDomainService.extractDomain).toHaveBeenCalledWith(longQuestion);
      expect(mockMultiStepProcessor.process).toHaveBeenCalledWith(longQuestion, 'example.com');
    });

    it('should handle domain extraction errors', async () => {
      const analyzeDto = {
        question: 'What does example.com do?',
      };

      const error = new Error('Domain extraction failed');
      mockDomainService.extractDomain.mockImplementation(() => {
        throw error;
      });

      await controller.analyzeQuestion(analyzeDto, mockResponse);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Failed to process question',
        error: error.message,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });

    it('should handle domain validation errors', async () => {
      const analyzeDto = {
        question: 'What does example.com do?',
      };

      mockDomainService.extractDomain.mockReturnValue('example.com');
      const error = new Error('Domain validation failed');
      mockDomainService.validateDomain.mockImplementation(() => {
        throw error;
      });

      await controller.analyzeQuestion(analyzeDto, mockResponse);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Failed to process question',
        error: error.message,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });

    it('should handle multi-step processor errors', async () => {
      const analyzeDto = {
        question: 'What does example.com do?',
      };

      mockDomainService.extractDomain.mockReturnValue('example.com');
      mockDomainService.validateDomain.mockReturnValue(true);

      const error = new Error('Processing failed');
      const mockStreamGenerator = (async function* () {
        throw error;
      })();
      mockMultiStepProcessor.process.mockReturnValue(mockStreamGenerator);

      await controller.analyzeQuestion(analyzeDto, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Failed to process question',
        error: 'Processing failed',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });

    it('should handle empty streaming response', async () => {
      const analyzeDto = {
        question: 'What does example.com do?',
      };

      mockDomainService.extractDomain.mockReturnValue('example.com');
      mockDomainService.validateDomain.mockReturnValue(true);

      const mockStreamGenerator = (async function* () {
        // No chunks yielded
      })();
      mockMultiStepProcessor.process.mockReturnValue(mockStreamGenerator);

      await controller.analyzeQuestion(analyzeDto, mockResponse);

      expect(mockResponse.write).not.toHaveBeenCalled();
      expect(mockResponse.end).toHaveBeenCalled();
    });

    it('should handle various domain formats', async () => {
      const testCases = [
        { question: 'What does https://example.com do?', expectedDomain: 'example.com' },
        { question: 'Tell me about www.google.com', expectedDomain: 'google.com' },
        { question: 'Analyze sub.example.com', expectedDomain: 'sub.example' },
        { question: 'What about EXAMPLE.COM?', expectedDomain: 'example.com' },
      ];

      for (const testCase of testCases) {
        const analyzeDto = { question: testCase.question };

        mockDomainService.extractDomain.mockReturnValue(testCase.expectedDomain);
        mockDomainService.validateDomain.mockReturnValue(true);

        const mockStreamGenerator = (async function* () {
          yield 'Analysis complete.';
        })();
        mockMultiStepProcessor.process.mockReturnValue(mockStreamGenerator);

        await controller.analyzeQuestion(analyzeDto, mockResponse);

        expect(mockDomainService.extractDomain).toHaveBeenCalledWith(testCase.question);
        expect(mockMultiStepProcessor.process).toHaveBeenCalledWith(testCase.question, testCase.expectedDomain);

        // Reset mocks for next iteration
        jest.clearAllMocks();
      }
    });

    it('should preserve BadRequestException and not wrap it', async () => {
      const analyzeDto = {
        question: 'What does example.com do?',
      };

      mockDomainService.extractDomain.mockReturnValue(null);

      const badRequestError = new BadRequestException('Please include a company domain in your question');
      
      await expect(controller.analyzeQuestion(analyzeDto, mockResponse)).rejects.toThrow(badRequestError);
      await expect(controller.analyzeQuestion(analyzeDto, mockResponse)).rejects.toThrow(BadRequestException);
    });
  });
}); 