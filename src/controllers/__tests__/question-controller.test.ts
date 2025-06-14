import { QuestionController } from '../question-controller';

// Mock the entire AiService module
jest.mock('../../services/ai-service');

describe('QuestionController', () => {
    let controller: QuestionController;

    beforeEach(() => {
        
        // Get fresh controller instance
        controller = QuestionController.getInstance();
    });

    describe('getInstance', () => {
        it('should return the same instance', () => {
            const instance1 = QuestionController.getInstance();
            const instance2 = QuestionController.getInstance();
            expect(instance1).toBe(instance2);
        });
    });

    describe('extractDomain', () => {
        it('should extract domain from question with http', () => {
            expect(controller.extractDomain('What does http://example.com do?')).toBe('example.com');
        });

        it('should extract domain from question with https', () => {
            expect(controller.extractDomain('What does https://example.com do?')).toBe('example.com');
        });

        it('should extract domain from question with www', () => {
            expect(controller.extractDomain('What does www.example.com do?')).toBe('example.com');
        });

        it('should extract domain from question without prefix', () => {
            expect(controller.extractDomain('What does example.com do?')).toBe('example.com');
        });

        it('should return null for question without domain', () => {
            expect(controller.extractDomain('What does this company do?')).toBeNull();
        });
    });

    describe('validateDomain', () => {
        it('should validate correct domains', () => {
            expect(controller.validateDomain('example.com')).toBe(true);
            expect(controller.validateDomain('sub.example.com')).toBe(true);
            expect(controller.validateDomain('example.io')).toBe(true);
        });

        it('should reject invalid domains', () => {
            expect(controller.validateDomain('example')).toBe(false);
            expect(controller.validateDomain('example.invalid')).toBe(false);
            expect(controller.validateDomain('!invalid.com')).toBe(false);
        });
    });
});