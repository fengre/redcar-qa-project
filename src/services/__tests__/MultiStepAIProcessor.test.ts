import { MultiStepAIProcessor } from '../MultiStepAIProcessor';
import { AIProvider } from '../interfaces/AIProvider';

describe('MultiStepAIProcessor', () => {
    let processor: MultiStepAIProcessor;
    let mockProvider: jest.Mocked<AIProvider>;

    beforeEach(() => {
        mockProvider = {
            getAnswer: jest.fn(),
            streamAnswer: jest.fn()
        };
        processor = new MultiStepAIProcessor(mockProvider);
    });

    describe('process', () => {
        it('should process all steps and return cleaned final answer', async () => {
            // Arrange
            const steps = ['Industry analysis', 'Product analysis', 'Final answer'];
            mockProvider.getAnswer
                .mockResolvedValueOnce({ text: steps[0] })
                .mockResolvedValueOnce({ text: steps[1] })
                .mockResolvedValueOnce({ text: steps[2] });

            // Act
            const result = await processor.process(
                'What does example.com do?',
                'example.com'
            );

            // Assert
            expect(mockProvider.getAnswer).toHaveBeenCalledTimes(3);
            expect(result).toContain('Based on the analysis');
            expect(result).toContain(steps[0]);
            expect(result).toContain(steps[1]);
            expect(result).toContain(steps[2]);
        });

        it('should clean [x] from final output', async () => {
            // Arrange
            mockProvider.getAnswer
                .mockResolvedValueOnce({ text: 'Step 1 [x] result' })
                .mockResolvedValueOnce({ text: 'Step 2 result' })
                .mockResolvedValueOnce({ text: 'Final [x] result' });

            // Act
            const result = await processor.process(
                'What does example.com do?',
                'example.com'
            );

            // Assert
            expect(result).not.toContain('[x]');
            expect(result).toContain('Step 1 result');
            expect(result).toContain('Final result');
        });

        it('should retry on failure', async () => {
            // Arrange
            mockProvider.getAnswer
                .mockRejectedValueOnce(new Error('API error'))
                .mockResolvedValueOnce({ text: 'Success after retry' });

            // Act
            const result = await processor.process(
                'What does example.com do?',
                'example.com'
            );

            // Assert
            expect(mockProvider.getAnswer).toHaveBeenCalledTimes(4); // 1 fail + 1 retry + 2 successful steps
            expect(result).toContain('Success after retry');
        });

        it('should throw error after max retries', async () => {
            // Arrange
            const error = new Error('API error');
            mockProvider.getAnswer.mockRejectedValue(error);

            // Act & Assert
            await expect(processor.process(
                'What does example.com do?',
                'example.com'
            )).rejects.toThrow('API error');
            expect(mockProvider.getAnswer).toHaveBeenCalledTimes(2); // Initial try + 1 retry
        });

        it('should include question context in prompts', async () => {
            // Arrange
            mockProvider.getAnswer.mockResolvedValue({ text: 'Test response' });
            const testQuestion = 'What does example.com do?';

            // Act
            await processor.process(testQuestion, 'example.com');

            // Assert
            const lastCall = mockProvider.getAnswer.mock.calls[2][0];
            expect(lastCall.question).toContain(testQuestion);
        });

        it('should accumulate context between steps', async () => {
            // Arrange
            mockProvider.getAnswer
                .mockResolvedValueOnce({ text: 'Step 1 context' })
                .mockResolvedValueOnce({ text: 'Step 2 context' })
                .mockResolvedValueOnce({ text: 'Final answer' });

            // Act
            await processor.process('Test question?', 'example.com');

            // Assert
            const secondCallContext = mockProvider.getAnswer.mock.calls[1][0].question;
            expect(secondCallContext).toContain('Step 1 context');

            const thirdCallContext = mockProvider.getAnswer.mock.calls[2][0].question;
            expect(thirdCallContext).toContain('Step 2 context');
        });
    });
});