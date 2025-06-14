import { QuestionController } from '../questionController';
import { AiService } from '../../services/aiService';

jest.mock('../../services/aiService');

describe('QuestionController', () => {
  let controller: QuestionController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = QuestionController.getInstance();
  });

  describe('extractDomain', () => {
    it('should extract domain from various URL formats', () => {
      const testCases = [
        { input: 'What does example.com do?', expected: 'example.com' },
        { input: 'Tell me about www.example.com', expected: 'example.com' },
        { input: 'What is https://example.com/about doing?', expected: 'example.com' },
        { input: 'Info on sub.example.com please', expected: 'sub.example.com' },
        { input: 'Compare example.co.uk vs others', expected: 'example.co.uk' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(controller.extractDomain(input)).toBe(expected);
      });
    });

    it('should return null for invalid inputs', () => {
      const invalidCases = [
        'What is the weather today?',
        'Tell me about @invalid.com',
        'How about example.',
        'Just some text'
      ];

      invalidCases.forEach(input => {
        expect(controller.extractDomain(input)).toBeNull();
      });
    });
  });

  describe('validateDomain', () => {
    it('should validate correct domains', () => {
      const validDomains = [
        'example.com',
        'sub.example.com',
        'my-site.io',
        'company.tech',
        'startup.app'
      ];

      validDomains.forEach(domain => {
        expect(controller.validateDomain(domain)).toBe(true);
      });
    });

    it('should reject invalid domains', () => {
      const invalidDomains = [
        'ex.invalid',
        'test@domain.com',
        'just.text',
        'no-tld',
        'too.short.a'
      ];

      invalidDomains.forEach(domain => {
        expect(controller.validateDomain(domain)).toBe(false);
      });
    });
  });

  describe('validateQuestion', () => {
    it('should validate proper questions', () => {
      const result = controller.validateQuestion('What does example.com do?');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty questions', () => {
      const result = controller.validateQuestion('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/cannot be empty/i);
    });

    it('should reject questions without domains', () => {
      const result = controller.validateQuestion('What is the weather?');
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/include a company domain/i);
    });

    it('should reject questions with invalid domains', () => {
      const result = controller.validateQuestion('What is invalid.domain?');
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/valid company domain/i);
    });
  });

  describe('processQuestion', () => {
    it('should process valid questions', async () => {
      const mockAnswer = { text: 'Test answer' };
      (AiService.getInstance() as jest.Mocked<AiService>).getAnswer = jest.fn().mockResolvedValue(mockAnswer);

      const result = await controller.processQuestion('What does example.com do?');
      expect(result).toBe('Test answer');
    });

    it('should throw error for invalid questions', async () => {
      await expect(controller.processQuestion('Invalid question'))
        .rejects
        .toThrow('No domain found in question');
    });
  });
});