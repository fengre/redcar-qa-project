import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PerplexityProvider } from './perplexity.provider';

// Mock fetch globally
global.fetch = jest.fn();

describe('PerplexityProvider', () => {
  let provider: PerplexityProvider;
  let configService: ConfigService;

  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerplexityProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    provider = module.get<PerplexityProvider>(PerplexityProvider);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize with API key', () => {
      const mockGet = jest.fn().mockReturnValue('test-api-key');
      jest.spyOn(configService, 'get').mockImplementation(mockGet);

      const newProvider = new PerplexityProvider(configService);
      expect(newProvider).toBeDefined();
      expect(mockGet).toHaveBeenCalledWith('PERPLEXITY_API_KEY');
    });

    it('should handle missing API key', () => {
      const mockGet = jest.fn().mockReturnValue(undefined);
      jest.spyOn(configService, 'get').mockImplementation(mockGet);

      const newProvider = new PerplexityProvider(configService);
      expect(newProvider).toBeDefined();
      expect(mockGet).toHaveBeenCalledWith('PERPLEXITY_API_KEY');
    });
  });

  describe('analyze', () => {
    it('should make successful API request and return response', async () => {
      const question = 'What does example.com do?';
      const domain = 'example.com';
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Example.com is a technology company.',
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      } as any);

      const result = await provider.analyze(question, domain);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.perplexity.ai/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer undefined',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'sonar',
            messages: [
              {
                role: 'system',
                content: `You are a helpful assistant that analyzes companies based on questions. 
            When asked about a company, provide detailed, accurate information based on current data.
            Always be professional and factual in your responses.`,
              },
              {
                role: 'user',
                content: `Question: ${question}\nCompany Domain: ${domain}`,
              },
            ],
            max_tokens: 2000,
            temperature: 0.7,
          }),
        }
      );

      expect(result).toBe('Example.com is a technology company.');
    });

    it('should handle empty response', async () => {
      const question = 'What does example.com do?';
      const domain = 'example.com';
      const mockResponse = {
        choices: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      } as any);

      const result = await provider.analyze(question, domain);

      expect(result).toBe('No response received');
    });

    it('should handle response without content', async () => {
      const question = 'What does example.com do?';
      const domain = 'example.com';
      const mockResponse = {
        choices: [
          {
            message: {},
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      } as any);

      const result = await provider.analyze(question, domain);

      expect(result).toBe('No response received');
    });

    it('should handle API error response', async () => {
      const question = 'What does example.com do?';
      const domain = 'example.com';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as any);

      await expect(provider.analyze(question, domain)).rejects.toThrow(
        'API request failed: 401 Unauthorized'
      );
    });

    it('should handle network errors', async () => {
      const question = 'What does example.com do?';
      const domain = 'example.com';

      const networkError = new Error('Network error');
      mockFetch.mockRejectedValueOnce(networkError);

      await expect(provider.analyze(question, domain)).rejects.toThrow('Network error');
    });

    it('should handle empty question and domain', async () => {
      const question = '';
      const domain = '';
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Empty analysis.',
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      } as any);

      const result = await provider.analyze(question, domain);

      expect(result).toBe('Empty analysis.');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.perplexity.ai/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer undefined',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'sonar',
            messages: [
              {
                role: 'system',
                content: `You are a helpful assistant that analyzes companies based on questions. 
            When asked about a company, provide detailed, accurate information based on current data.
            Always be professional and factual in your responses.`,
              },
              {
                role: 'user',
                content: 'Question: \nCompany Domain: ',
              },
            ],
            max_tokens: 2000,
            temperature: 0.7,
          }),
        }
      );
    });
  });

  describe('streamAnalyze', () => {
    it('should stream response successfully', async () => {
      const question = 'What does example.com do?';
      const domain = 'example.com';

      // Mock ReadableStream
      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Example"}}]}\n') })
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":".com"}}]}\n') })
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":" is"}}]}\n') })
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":" a"}}]}\n') })
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":" company"}}]}\n') })
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: [DONE]\n') })
          .mockResolvedValueOnce({ done: true }),
        releaseLock: jest.fn(),
      };

      const mockResponse = {
        ok: true,
        body: {
          getReader: jest.fn().mockReturnValue(mockReader),
        },
      };

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const chunks: string[] = [];
      for await (const chunk of provider.streamAnalyze(question, domain)) {
        chunks.push(chunk);
      }

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.perplexity.ai/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer undefined',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'sonar',
            messages: [
              {
                role: 'system',
                content: `You are a helpful assistant that analyzes companies based on questions. 
            When asked about a company, provide detailed, accurate information based on current data.
            Always be professional and factual in your responses.`,
              },
              {
                role: 'user',
                content: `Question: ${question}\nCompany Domain: ${domain}`,
              },
            ],
            stream: true,
            max_tokens: 2000,
            temperature: 0.7,
          }),
        }
      );

      expect(chunks).toEqual(['Example', '.com', ' is', ' a', ' company']);
      expect(mockReader.releaseLock).toHaveBeenCalled();
    });

    it('should handle malformed JSON in stream', async () => {
      const question = 'What does example.com do?';
      const domain = 'example.com';

      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: invalid json\n') })
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Valid"}}]}\n') })
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: [DONE]\n') })
          .mockResolvedValueOnce({ done: true }),
        releaseLock: jest.fn(),
      };

      const mockResponse = {
        ok: true,
        body: {
          getReader: jest.fn().mockReturnValue(mockReader),
        },
      };

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const chunks: string[] = [];
      for await (const chunk of provider.streamAnalyze(question, domain)) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Valid']);
      expect(mockReader.releaseLock).toHaveBeenCalled();
    });

    it('should handle empty stream response', async () => {
      const question = 'What does example.com do?';
      const domain = 'example.com';

      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: [DONE]\n') })
          .mockResolvedValueOnce({ done: true }),
        releaseLock: jest.fn(),
      };

      const mockResponse = {
        ok: true,
        body: {
          getReader: jest.fn().mockReturnValue(mockReader),
        },
      };

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const chunks: string[] = [];
      for await (const chunk of provider.streamAnalyze(question, domain)) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual([]);
      expect(mockReader.releaseLock).toHaveBeenCalled();
    });

    it('should handle API error response in streaming', async () => {
      const question = 'What does example.com do?';
      const domain = 'example.com';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as any);

      await expect(async () => {
        for await (const chunk of provider.streamAnalyze(question, domain)) {
          // This should not be reached
        }
      }).rejects.toThrow('API request failed: 500 Internal Server Error');
    });

    it('should handle missing response body', async () => {
      const question = 'What does example.com do?';
      const domain = 'example.com';

      const mockResponse = {
        ok: true,
        body: null,
      };

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      await expect(async () => {
        for await (const chunk of provider.streamAnalyze(question, domain)) {
          // This should not be reached
        }
      }).rejects.toThrow('Failed to get response reader');
    });

    it('should handle reader errors', async () => {
      const question = 'What does example.com do?';
      const domain = 'example.com';

      const mockReader = {
        read: jest.fn().mockRejectedValue(new Error('Reader error')),
        releaseLock: jest.fn(),
      };

      const mockResponse = {
        ok: true,
        body: {
          getReader: jest.fn().mockReturnValue(mockReader),
        },
      };

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      await expect(async () => {
        for await (const chunk of provider.streamAnalyze(question, domain)) {
          // This should not be reached
        }
      }).rejects.toThrow('Reader error');

      expect(mockReader.releaseLock).toHaveBeenCalled();
    });

    it('should handle partial data chunks', async () => {
      const question = 'What does example.com do?';
      const domain = 'example.com';

      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Example"}}]}\n') })
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":".com"}}]}\n') })
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":" is"}}]}\n') })
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":" a"}}]}\n') })
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":" company"}}]}\n') })
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: [DONE]\n') })
          .mockResolvedValueOnce({ done: true }),
        releaseLock: jest.fn(),
      };

      const mockResponse = {
        ok: true,
        body: {
          getReader: jest.fn().mockReturnValue(mockReader),
        },
      };

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const chunks: string[] = [];
      for await (const chunk of provider.streamAnalyze(question, domain)) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Example', '.com', ' is', ' a', ' company']);
      expect(mockReader.releaseLock).toHaveBeenCalled();
    });
  });
}); 