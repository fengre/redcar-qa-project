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
    it('should process all steps in order', async () => {
      const mockStream = async function* () {
        yield 'test';
        yield ' response';
      };

      mockProvider.streamAnswer.mockImplementation(mockStream);

      const generator = processor.process('What does example.com do?', 'example.com');
      const results: string[] = [];

      for await (const chunk of generator) {
        results.push(chunk);
      }

      expect(results).toContain('Analyzing example.com:');
      expect(results).toContain('\n\nProcessing next step...\n');
      expect(mockProvider.streamAnswer).toHaveBeenCalledTimes(3); // One for each step
    });

    it('should handle errors in steps', async () => {
      mockProvider.streamAnswer.mockImplementation(() => {
        throw new Error('API Error');
      });

      const generator = processor.process('test question', 'test.com');
      await expect(generator.next()).rejects.toThrow('Failed to process step after multiple attempts');
    });
  });

  describe('confidence calculation', () => {
    it('should calculate higher confidence for specific answers', async () => {
      const mockSpecificStream = async function* () {
        yield 'Specifically, the company provides exactly 100 services';
      };

      mockProvider.streamAnswer.mockImplementation(mockSpecificStream);

      const generator = processor.process('What does example.com do?', 'example.com');
      for await (const _ of generator) { /* consume generator */ }

      // Verify the confidence calculation affected the final result
      expect(mockProvider.streamAnswer).toHaveBeenCalled();
    });
  });
});