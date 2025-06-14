import { QuestionController } from '../questionController';

describe('QuestionController', () => {
  let controller: QuestionController;

  beforeEach(() => {
    controller = QuestionController.getInstance();
  });

  describe('extractDomain', () => {
    it('should extract domain from a simple URL', () => {
      const question = 'What does example.com do?';
      expect(controller.extractDomain(question)).toBe('example.com');
    });

    it('should extract domain from a URL with www', () => {
      const question = 'Tell me about www.example.com';
      expect(controller.extractDomain(question)).toBe('example.com');
    });

    it('should extract domain from a full URL', () => {
      const question = 'What is https://example.com/about doing?';
      expect(controller.extractDomain(question)).toBe('example.com');
    });

    it('should return null for questions without domains', () => {
      const question = 'What is the weather today?';
      expect(controller.extractDomain(question)).toBeNull();
    });
  });
});