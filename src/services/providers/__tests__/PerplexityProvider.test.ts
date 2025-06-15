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
        it('should stream response chunks', async () => {
            // Arrange
            const question: Question = { question: 'test question', domain: 'test.com' };
            const testResponse = 'Hello World';
            
            // Mock stream reader
            const mockReader = {
                read: jest.fn()
                    .mockResolvedValueOnce({
                        done: false,
                        value: new TextEncoder().encode(
                            `data: ${JSON.stringify({
                                choices: [{ delta: { content: testResponse } }]
                            })}\n\n`
                        )
                    })
                    .mockResolvedValueOnce({
                        done: false,
                        value: new TextEncoder().encode('data: [DONE]\n\n')
                    })
                    .mockResolvedValueOnce({ done: true }),
                releaseLock: jest.fn()
            };

            // Mock response
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                body: {
                    getReader: () => mockReader
                }
            });

            // Act
            const chunks: string[] = [];
            for await (const chunk of provider.streamAnswer(question)) {
                chunks.push(chunk);
            }

            // Assert
            expect(chunks.join('')).toBe(testResponse);
            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.perplexity.ai/chat/completions',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer test-api-key',
                        'Content-Type': 'application/json'
                    }),
                    body: expect.any(String)
                })
            );
            expect(mockReader.read).toHaveBeenCalled();
            expect(mockReader.releaseLock).toHaveBeenCalled();
        });

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