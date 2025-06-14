import { PerplexityProvider } from '../PerplexityProvider';
import { Question } from '../../../models/types';

describe('PerplexityProvider', () => {
  let provider: PerplexityProvider;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY = mockApiKey;
    provider = new PerplexityProvider();
  });

  it('should throw error if API key is not configured', () => {
    delete process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;
    expect(() => new PerplexityProvider()).toThrow('Perplexity API key is not configured');
  });

  describe('streamAnswer', () => {
    it('should handle streaming response correctly', async () => {
      const question: Question = {
        question: 'What does example.com do?',
        domain: 'example.com'
      };

      const mockResponse = new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue('data: {"choices":[{"delta":{"content":"Test"}}]}\n\n');
            controller.enqueue('data: {"choices":[{"delta":{"content":" response"}}]}\n\n');
            controller.close();
          }
        })
      );

      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      let result = '';
      for await (const chunk of provider.streamAnswer(question)) {
        result += chunk;
      }

      expect(result).toBe('Test response');
    });
  });
});