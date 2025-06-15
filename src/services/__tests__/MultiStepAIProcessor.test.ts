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

    it('should process steps and stream final answer', async () => {
        // Arrange
        const testQuestion = 'What does example.com do?';
        const testDomain = 'example.com';
        const mockAnswers = [
            'Tech industry',
            'Cloud services',
            'Final answer'
        ];

        // Mock intermediate steps
        mockProvider.getAnswer
            .mockResolvedValueOnce({ text: mockAnswers[0] })
            .mockResolvedValueOnce({ text: mockAnswers[1] });

        // Mock final streaming step
        const mockStream = async function* () {
            for (const char of mockAnswers[2]) {
                yield char;
            }
        };
        mockProvider.streamAnswer.mockImplementation(mockStream);

        // Act
        const result: string[] = [];
        for await (const chunk of processor.process(testQuestion, testDomain)) {
            result.push(chunk);
        }

        // Assert
        expect(mockProvider.getAnswer).toHaveBeenCalledTimes(2);
        expect(mockProvider.streamAnswer).toHaveBeenCalledTimes(1);
        expect(result.join('')).toBe(mockAnswers[2]);
    });
});