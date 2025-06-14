import { PerplexityProvider } from '../PerplexityProvider';
import { Question } from '../../../models/types';
import 'whatwg-fetch';

describe('PerplexityProvider', () => {
  let provider: PerplexityProvider;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY = mockApiKey;
    provider = new PerplexityProvider();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('constructor', () => {
    it('should throw error if API key is not configured', () => {
      delete process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;
      expect(() => new PerplexityProvider()).toThrow('Perplexity API key is not configured');
    });

    it('should initialize with API key', () => {
      expect(provider).toBeInstanceOf(PerplexityProvider);
    });
  });

  describe('streamAnswer', () => {
    const mockQuestion: Question = {
      question: 'What does example.com do?',
      domain: 'example.com'
    };

    it('should handle successful streaming response', async () => {
      const encoder = new TextEncoder();
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"Test"}}]}\n\n'));
          controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":" response"}}]}\n\n'));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      });

      global.fetch = jest.fn().mockResolvedValue(new Response(mockStream));

      let result = '';
      for await (const chunk of provider.streamAnswer(mockQuestion)) {
        result += chunk;
      }
      expect(result).toBe('Test response');
    });

    it('should handle API errors', async () => {
      global.fetch = jest.fn().mockResolvedValue(new Response(null, { 
        status: 400, 
        statusText: 'Bad Request' 
      }));

      await expect(provider.streamAnswer(mockQuestion).next())
        .rejects
        .toThrow('Stream response error: 400');
    });

    it('should handle malformed JSON in stream', async () => {
      const encoder = new TextEncoder();
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: {"malformed_json"\n\n'));
          controller.close();
        }
      });

      global.fetch = jest.fn().mockResolvedValue(new Response(mockStream));

      let result = '';
      for await (const chunk of provider.streamAnswer(mockQuestion)) {
        result += chunk;
      }
      expect(result).toBe('');
    });
  });

  describe('getAnswer', () => {
    it('should return complete answer from stream', async () => {
      const encoder = new TextEncoder();
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"Complete"}}]}\n\n'));
          controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":" answer"}}]}\n\n'));
          controller.close();
        }
      });

      global.fetch = jest.fn().mockResolvedValue(new Response(mockStream));

      const result = await provider.getAnswer({
        question: 'test',
        domain: 'test.com'
      });

      expect(result.text).toBe('Complete answer');
    });

    it('should throw error if no response received', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.close();
        }
      });

      global.fetch = jest.fn().mockResolvedValue(new Response(mockStream));

      await expect(provider.getAnswer({
        question: 'test',
        domain: 'test.com'
      })).rejects.toThrow('No response received from Perplexity');
    });
  });
});