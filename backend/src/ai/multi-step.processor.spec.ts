import { Test, TestingModule } from '@nestjs/testing';
import { MultiStepProcessor } from './multi-step.processor';
import { IAiProvider } from './ai-provider.interface';

describe('MultiStepProcessor', () => {
  let processor: MultiStepProcessor;
  let mockAiProvider: jest.Mocked<IAiProvider>;

  beforeEach(async () => {
    mockAiProvider = {
      analyze: jest.fn(),
      streamAnalyze: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MultiStepProcessor,
        {
          provide: 'IAiProvider',
          useValue: mockAiProvider,
        },
      ],
    }).compile();

    processor = module.get<MultiStepProcessor>(MultiStepProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    it('should process question through all steps successfully for legitimate company', async () => {
      const question = 'What does example.com do?';
      const domain = 'example.com';

      // Mock responses for the first two steps
      mockAiProvider.analyze
        .mockResolvedValueOnce('true') // Step 1: Company is legitimate
        .mockResolvedValueOnce('Technology industry. Software development services.'); // Step 2: Industry and services

      // Mock streaming response for the final step
      const mockStreamGenerator = (async function* () {
        yield 'Example.com is a technology company that provides software development services.';
      })();
      mockAiProvider.streamAnalyze.mockReturnValue(mockStreamGenerator);

      const chunks: string[] = [];
      for await (const chunk of processor.process(question, domain)) {
        chunks.push(chunk);
      }

      // Verify the first two analyze calls
      expect(mockAiProvider.analyze).toHaveBeenCalledTimes(2);
      expect(mockAiProvider.analyze).toHaveBeenNthCalledWith(
        1,
        'Analyzing example.com:\n\n\nFirst, analyze the company based on the domain. Is it a legitimate company and website? If not, return \'false\'. If it is, return \'true\'.',
        ''
      );
      expect(mockAiProvider.analyze).toHaveBeenNthCalledWith(
        2,
        'Analyzing example.com:\n\ntrue\n\nIf the previous response is true, give some background knowledge on what industry the company is in and what the main products or services are. If the previous response is false, return \'false\'.',
        ''
      );

      // Verify the streaming call
      expect(mockAiProvider.streamAnalyze).toHaveBeenCalledTimes(1);
      const actualArgs = mockAiProvider.streamAnalyze.mock.calls[0];
      const expectedContext = 'Analyzing example.com:\n\ntrue\nTechnology industry. Software development services.\n\nIf the previous response is not false, using all previous information, answer this specific question in a very short, simple, and concise manner, while also removing link references: What does example.com do?. Otherwise, explain in a simple, concise manner that the company or website does not seem to exist or is not a legitimate company or website.';
      // Debug log for whitespace issues
      // eslint-disable-next-line no-console
      console.log('---EXPECTED---\n' + expectedContext.split('\n').map(l => '>' + l + '<').join('\n'));
      // eslint-disable-next-line no-console
      console.log('---ACTUAL---\n' + actualArgs[0].split('\n').map(l => '>' + l + '<').join('\n'));
      // Debug log for character codes
      // eslint-disable-next-line no-console
      console.log('---EXPECTED CHAR CODES---');
      // eslint-disable-next-line no-console
      console.log(expectedContext.split('').map(c => c.charCodeAt(0)).join(','));
      // eslint-disable-next-line no-console
      console.log('---ACTUAL CHAR CODES---');
      // eslint-disable-next-line no-console
      console.log(actualArgs[0].split('').map(c => c.charCodeAt(0)).join(','));
      expect(actualArgs[0]).toBe(expectedContext);
      expect(actualArgs[1]).toBe('example.com');

      expect(chunks).toEqual(['Example.com is a technology company that provides software development services.']);
    });

    it('should handle illegitimate company in step 1', async () => {
      const question = 'What does fakecompany.com do?';
      const domain = 'fakecompany.com';

      // Mock response for step 1 - company is not legitimate
      mockAiProvider.analyze
        .mockResolvedValueOnce('false')
        .mockResolvedValueOnce('false');

      // Mock streaming response for the final step
      const mockStreamGenerator = (async function* () {
        yield 'The company or website does not seem to exist or is not a legitimate company or website.';
      })();
      mockAiProvider.streamAnalyze.mockReturnValue(mockStreamGenerator);

      const chunks: string[] = [];
      for await (const chunk of processor.process(question, domain)) {
        chunks.push(chunk);
      }

      // Verify both analyze calls (processor always runs both steps)
      expect(mockAiProvider.analyze).toHaveBeenCalledTimes(2);
      expect(mockAiProvider.analyze).toHaveBeenNthCalledWith(
        1,
        'Analyzing fakecompany.com:\n\n\nFirst, analyze the company based on the domain. Is it a legitimate company and website? If not, return \'false\'. If it is, return \'true\'.',
        ''
      );
      expect(mockAiProvider.analyze).toHaveBeenNthCalledWith(
        2,
        'Analyzing fakecompany.com:\n\nfalse\n\nIf the previous response is true, give some background knowledge on what industry the company is in and what the main products or services are. If the previous response is false, return \'false\'.',
        ''
      );

      // Verify the streaming call with failure message
      expect(mockAiProvider.streamAnalyze).toHaveBeenCalledTimes(1);
      expect(mockAiProvider.streamAnalyze).toHaveBeenCalledWith(
        'Analyzing fakecompany.com:\n\nfalse\nfalse\n\nIf the previous response is not false, using all previous information, answer this specific question in a very short, simple, and concise manner, while also removing link references: What does fakecompany.com do?. Otherwise, explain in a simple, concise manner that the company or website does not seem to exist or is not a legitimate company or website.',
        'fakecompany.com'
      );

      expect(chunks).toEqual(['The company or website does not seem to exist or is not a legitimate company or website.']);
    });

    it('should handle step 2 returning false', async () => {
      const question = 'What does suspicious.com do?';
      const domain = 'suspicious.com';

      // Mock responses - step 1 says true, but step 2 returns false
      mockAiProvider.analyze
        .mockResolvedValueOnce('true') // Step 1: Company is legitimate
        .mockResolvedValueOnce('false'); // Step 2: Cannot determine industry/services

      // Mock streaming response for the final step
      const mockStreamGenerator = (async function* () {
        yield 'The company or website does not seem to exist or is not a legitimate company or website.';
      })();
      mockAiProvider.streamAnalyze.mockReturnValue(mockStreamGenerator);

      const chunks: string[] = [];
      for await (const chunk of processor.process(question, domain)) {
        chunks.push(chunk);
      }

      // Verify both analyze calls
      expect(mockAiProvider.analyze).toHaveBeenCalledTimes(2);
      expect(mockAiProvider.streamAnalyze).toHaveBeenCalledTimes(1);
      expect(mockAiProvider.streamAnalyze).toHaveBeenCalledWith(
        'Analyzing suspicious.com:\n\ntrue\nfalse\n\nIf the previous response is not false, using all previous information, answer this specific question in a very short, simple, and concise manner, while also removing link references: What does suspicious.com do?. Otherwise, explain in a simple, concise manner that the company or website does not seem to exist or is not a legitimate company or website.',
        'suspicious.com'
      );

      expect(chunks).toEqual(['The company or website does not seem to exist or is not a legitimate company or website.']);
    });

    it('should handle empty question and domain', async () => {
      const question = '';
      const domain = '';

      mockAiProvider.analyze
        .mockResolvedValueOnce('true')
        .mockResolvedValueOnce('Industry analysis. Product analysis.');

      const mockStreamGenerator = (async function* () {
        yield 'Final answer.';
      })();
      mockAiProvider.streamAnalyze.mockReturnValue(mockStreamGenerator);

      const chunks: string[] = [];
      for await (const chunk of processor.process(question, domain)) {
        chunks.push(chunk);
      }

      expect(mockAiProvider.analyze).toHaveBeenCalledTimes(2);
      expect(mockAiProvider.streamAnalyze).toHaveBeenCalledTimes(1);
      expect(chunks).toEqual(['Final answer.']);
    });

    it('should handle special characters in question and domain', async () => {
      const question = 'What does example.com do? 🚀';
      const domain = 'example.com';

      mockAiProvider.analyze
        .mockResolvedValueOnce('true')
        .mockResolvedValueOnce('Technology industry. Software development services.');

      const mockStreamGenerator = (async function* () {
        yield 'Example.com is a technology company! 💻';
      })();
      mockAiProvider.streamAnalyze.mockReturnValue(mockStreamGenerator);

      const chunks: string[] = [];
      for await (const chunk of processor.process(question, domain)) {
        chunks.push(chunk);
      }

      expect(mockAiProvider.analyze).toHaveBeenCalledTimes(2);
      expect(mockAiProvider.streamAnalyze).toHaveBeenCalledTimes(1);
      expect(chunks).toEqual(['Example.com is a technology company! 💻']);
    });

    it('should handle long question and domain', async () => {
      const question = 'A'.repeat(1000);
      const domain = 'B'.repeat(100);

      mockAiProvider.analyze
        .mockResolvedValueOnce('true')
        .mockResolvedValueOnce('Industry analysis. Product analysis.');

      const mockStreamGenerator = (async function* () {
        yield 'Long answer.';
      })();
      mockAiProvider.streamAnalyze.mockReturnValue(mockStreamGenerator);

      const chunks: string[] = [];
      for await (const chunk of processor.process(question, domain)) {
        chunks.push(chunk);
      }

      expect(mockAiProvider.analyze).toHaveBeenCalledTimes(2);
      expect(mockAiProvider.streamAnalyze).toHaveBeenCalledTimes(1);
      expect(chunks).toEqual(['Long answer.']);
    });

    it('should handle multiple chunks in streaming response', async () => {
      const question = 'What does example.com do?';
      const domain = 'example.com';

      mockAiProvider.analyze
        .mockResolvedValueOnce('true')
        .mockResolvedValueOnce('Technology industry. Software development services.');

      const mockStreamGenerator = (async function* () {
        yield 'Example.com ';
        yield 'is a technology ';
        yield 'company.';
      })();
      mockAiProvider.streamAnalyze.mockReturnValue(mockStreamGenerator);

      const chunks: string[] = [];
      for await (const chunk of processor.process(question, domain)) {
        chunks.push(chunk);
      }

      expect(mockAiProvider.analyze).toHaveBeenCalledTimes(2);
      expect(mockAiProvider.streamAnalyze).toHaveBeenCalledTimes(1);
      expect(chunks).toEqual(['Example.com ', 'is a technology ', 'company.']);
    });

    it('should handle empty streaming response', async () => {
      const question = 'What does example.com do?';
      const domain = 'example.com';

      mockAiProvider.analyze
        .mockResolvedValueOnce('true')
        .mockResolvedValueOnce('Technology industry. Software development services.');

      const mockStreamGenerator = (async function* () {
        // No chunks yielded
      })();
      mockAiProvider.streamAnalyze.mockReturnValue(mockStreamGenerator);

      const chunks: string[] = [];
      for await (const chunk of processor.process(question, domain)) {
        chunks.push(chunk);
      }

      expect(mockAiProvider.analyze).toHaveBeenCalledTimes(2);
      expect(mockAiProvider.streamAnalyze).toHaveBeenCalledTimes(1);
      expect(chunks).toEqual([]);
    });

    it('should handle analyze method errors', async () => {
      const question = 'What does example.com do?';
      const domain = 'example.com';

      const error = new Error('AI provider error');
      mockAiProvider.analyze.mockRejectedValue(error);

      const mockStreamGenerator = (async function* () {
        yield 'Final answer.';
      })();
      mockAiProvider.streamAnalyze.mockReturnValue(mockStreamGenerator);

      await expect(async () => {
        for await (const chunk of processor.process(question, domain)) {
          // This should not be reached
        }
      }).rejects.toThrow('AI provider error');

      expect(mockAiProvider.analyze).toHaveBeenCalledTimes(1);
      expect(mockAiProvider.streamAnalyze).toHaveBeenCalledTimes(0);
    });

    it('should handle streaming method errors', async () => {
      const question = 'What does example.com do?';
      const domain = 'example.com';

      mockAiProvider.analyze
        .mockResolvedValueOnce('true')
        .mockResolvedValueOnce('Technology industry. Software development services.');

      const error = new Error('Streaming error');
      const mockStreamGenerator = (async function* () {
        throw error;
      })();
      mockAiProvider.streamAnalyze.mockReturnValue(mockStreamGenerator);

      await expect(async () => {
        for await (const chunk of processor.process(question, domain)) {
          // This should not be reached
        }
      }).rejects.toThrow('Streaming error');

      expect(mockAiProvider.analyze).toHaveBeenCalledTimes(2);
      expect(mockAiProvider.streamAnalyze).toHaveBeenCalledTimes(1);
    });

    it('should build context correctly through steps', async () => {
      const question = 'What does example.com do?';
      const domain = 'example.com';

      mockAiProvider.analyze
        .mockResolvedValueOnce('true')
        .mockResolvedValueOnce('Technology industry. Software development services.');

      const mockStreamGenerator = (async function* () {
        yield 'Final answer.';
      })();
      mockAiProvider.streamAnalyze.mockReturnValue(mockStreamGenerator);

      const chunks: string[] = [];
      for await (const chunk of processor.process(question, domain)) {
        chunks.push(chunk);
      }

      // Verify the context building
      expect(mockAiProvider.analyze).toHaveBeenNthCalledWith(
        1,
        'Analyzing example.com:\n\n\nFirst, analyze the company based on the domain. Is it a legitimate company and website? If not, return \'false\'. If it is, return \'true\'.',
        ''
      );

      expect(mockAiProvider.analyze).toHaveBeenNthCalledWith(
        2,
        'Analyzing example.com:\n\ntrue\n\nIf the previous response is true, give some background knowledge on what industry the company is in and what the main products or services are. If the previous response is false, return \'false\'.',
        ''
      );

      expect(mockAiProvider.streamAnalyze).toHaveBeenCalledWith(
        'Analyzing example.com:\n\ntrue\nTechnology industry. Software development services.\n\nIf the previous response is not false, using all previous information, answer this specific question in a very short, simple, and concise manner, while also removing link references: What does example.com do?. Otherwise, explain in a simple, concise manner that the company or website does not seem to exist or is not a legitimate company or website.',
        'example.com'
      );

      expect(chunks).toEqual(['Final answer.']);
    });
  });
}); 