import { PerplexityProvider } from '../PerplexityProvider';
import { Question } from '../../../models/types';
import { TextEncoder } from 'util';

describe('PerplexityProvider', () => {
    let provider: PerplexityProvider;
    let mockFetch: jest.Mock;

    beforeEach(() => {
        process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY = 'test-api-key';
        mockFetch = jest.fn();
        global.fetch = mockFetch;
        provider = new PerplexityProvider();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('initialization', () => {
        it('should throw error if API key is not configured', () => {
            delete process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;
            expect(() => new PerplexityProvider()).toThrow('Perplexity API key is not configured');
        });
    });

    describe('streamAnswer', () => {

        it('should handle API errors', async () => {
            // Arrange
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400
            });

            // Act & Assert
            await expect(async () => {
                const gen = provider.streamAnswer({ question: 'test', domain: 'test.com' });
                await gen.next();
            }).rejects.toThrow('Stream response error: 400');
        });
    });
});