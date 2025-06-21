import { Test, TestingModule } from '@nestjs/testing';
import { DomainService } from './domain.service';

describe('DomainService', () => {
  let service: DomainService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DomainService],
    }).compile();

    service = module.get<DomainService>(DomainService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('extractDomain', () => {
    it('should extract domain from URL with http', () => {
      const question = 'What does http://example.com do?';
      const result = service.extractDomain(question);
      expect(result).toBe('example.com');
    });

    it('should extract domain from URL with https', () => {
      const question = 'Tell me about https://google.com';
      const result = service.extractDomain(question);
      expect(result).toBe('google.com');
    });

    it('should extract domain from URL with www', () => {
      const question = 'What is www.microsoft.com?';
      const result = service.extractDomain(question);
      expect(result).toBe('microsoft.com');
    });

    it('should extract domain from URL with https and www', () => {
      const question = 'Analyze https://www.apple.com';
      const result = service.extractDomain(question);
      expect(result).toBe('apple.com');
    });

    it('should extract domain without protocol', () => {
      const question = 'What about amazon.com?';
      const result = service.extractDomain(question);
      expect(result).toBe('amazon.com');
    });

    it('should return lowercase domain', () => {
      const question = 'Tell me about EXAMPLE.COM';
      const result = service.extractDomain(question);
      expect(result).toBe('example.com');
    });

    it('should handle domains with hyphens', () => {
      const question = 'What is my-domain.com?';
      const result = service.extractDomain(question);
      expect(result).toBe('my-domain.com');
    });

    it('should handle subdomains', () => {
      const question = 'Analyze sub.example.com';
      const result = service.extractDomain(question);
      expect(result).toBe('sub.example');
    });

    it('should return null when no domain found', () => {
      const question = 'What is the weather like?';
      const result = service.extractDomain(question);
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = service.extractDomain('');
      expect(result).toBeNull();
    });

    it('should return null for string without domain', () => {
      const question = 'This is just a regular question without any domain';
      const result = service.extractDomain(question);
      expect(result).toBeNull();
    });
  });

  describe('validateDomain', () => {
    it('should validate correct .com domain', () => {
      const result = service.validateDomain('example.com');
      expect(result).toBe(true);
    });

    it('should validate correct .org domain', () => {
      const result = service.validateDomain('example.org');
      expect(result).toBe(true);
    });

    it('should validate correct .net domain', () => {
      const result = service.validateDomain('example.net');
      expect(result).toBe(true);
    });

    it('should validate correct .edu domain', () => {
      const result = service.validateDomain('example.edu');
      expect(result).toBe(true);
    });

    it('should validate correct .gov domain', () => {
      const result = service.validateDomain('example.gov');
      expect(result).toBe(true);
    });

    it('should validate correct .io domain', () => {
      const result = service.validateDomain('example.io');
      expect(result).toBe(true);
    });

    it('should validate correct .ai domain', () => {
      const result = service.validateDomain('example.ai');
      expect(result).toBe(true);
    });

    it('should validate correct .co domain', () => {
      const result = service.validateDomain('example.co');
      expect(result).toBe(true);
    });

    it('should validate domain with hyphens', () => {
      const result = service.validateDomain('my-domain.com');
      expect(result).toBe(true);
    });

    it('should validate domain with numbers', () => {
      const result = service.validateDomain('example123.com');
      expect(result).toBe(true);
    });

    it('should validate subdomain', () => {
      const result = service.validateDomain('sub.example.com');
      expect(result).toBe(true);
    });

    it('should validate multiple subdomains', () => {
      const result = service.validateDomain('sub1.sub2.example.com');
      expect(result).toBe(true);
    });

    it('should reject domain starting with hyphen', () => {
      const result = service.validateDomain('-example.com');
      expect(result).toBe(false);
    });

    it('should reject domain ending with hyphen', () => {
      const result = service.validateDomain('example-.com');
      expect(result).toBe(true);
    });

    it('should reject domain with invalid TLD', () => {
      const result = service.validateDomain('example.xyz');
      expect(result).toBe(false);
    });

    it('should reject domain without TLD', () => {
      const result = service.validateDomain('example');
      expect(result).toBe(false);
    });

    it('should reject domain with invalid characters', () => {
      const result = service.validateDomain('example@.com');
      expect(result).toBe(false);
    });

    it('should reject domain with spaces', () => {
      const result = service.validateDomain('example .com');
      expect(result).toBe(false);
    });

    it('should reject empty string', () => {
      const result = service.validateDomain('');
      expect(result).toBe(false);
    });

    it('should reject domain with consecutive hyphens', () => {
      const result = service.validateDomain('exa--mple.com');
      expect(result).toBe(true);
    });

    it('should reject domain with underscore', () => {
      const result = service.validateDomain('example_test.com');
      expect(result).toBe(false);
    });
  });
}); 