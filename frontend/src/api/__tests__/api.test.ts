import { extractDomain, validateDomain, analyzeQuestion, getHistory, saveHistory } from '../api';

// Mock fetch globally
global.fetch = jest.fn();

const API_BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';

describe('API Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractDomain', () => {
    it('should extract domain from question with http://', () => {
      const question = 'What does http://microsoft.com do?';
      expect(extractDomain(question)).toBe('microsoft.com');
    });

    it('should extract domain from question with https://', () => {
      const question = 'What does https://google.com do?';
      expect(extractDomain(question)).toBe('google.com');
    });

    it('should extract domain from question with www.', () => {
      const question = 'What does www.apple.com do?';
      expect(extractDomain(question)).toBe('apple.com');
    });

    it('should extract domain from question without protocol or www', () => {
      const question = 'What does amazon.com do?';
      expect(extractDomain(question)).toBe('amazon.com');
    });

    it('should extract domain with subdomain', () => {
      const question = 'What does blog.github.com do?';
      expect(extractDomain(question)).toBe('blog.github.com');
    });

    it('should return null when no domain is found', () => {
      const question = 'What is the weather like today?';
      expect(extractDomain(question)).toBeNull();
    });

    it('should handle multiple domains and return the first one', () => {
      const question = 'Compare microsoft.com and apple.com';
      expect(extractDomain(question)).toBe('microsoft.com');
    });

    it('should convert domain to lowercase', () => {
      const question = 'What does MICROSOFT.COM do?';
      expect(extractDomain(question)).toBe('microsoft.com');
    });
  });

  describe('validateDomain', () => {
    it('should validate common TLDs', () => {
      expect(validateDomain('example.com')).toBe(true);
      expect(validateDomain('example.org')).toBe(true);
      expect(validateDomain('example.net')).toBe(true);
      expect(validateDomain('example.edu')).toBe(true);
      expect(validateDomain('example.gov')).toBe(true);
      expect(validateDomain('example.io')).toBe(true);
      expect(validateDomain('example.ai')).toBe(true);
      expect(validateDomain('example.co')).toBe(true);
    });

    it('should validate domains with hyphens', () => {
      expect(validateDomain('my-example.com')).toBe(true);
      expect(validateDomain('example-site.org')).toBe(true);
    });

    it('should validate domains with subdomains', () => {
      expect(validateDomain('blog.example.com')).toBe(true);
      expect(validateDomain('api.example.org')).toBe(true);
    });

    it('should reject invalid TLDs', () => {
      expect(validateDomain('example.xyz')).toBe(false);
      expect(validateDomain('example.invalid')).toBe(false);
    });

    it('should reject domains with invalid characters', () => {
      expect(validateDomain('example.com!')).toBe(false);
    });

    it('should reject domains starting with hyphen', () => {
      expect(validateDomain('-example.com')).toBe(false);
    });

    it('should reject domains ending with hyphen', () => {
      expect(validateDomain('example-.com')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(validateDomain('')).toBe(false);
    });
  });

  describe('analyzeQuestion', () => {
    it('should make POST request to correct endpoint', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('test response'));
          controller.close();
        }
      });

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: mockStream
      });

      await analyzeQuestion('What does microsoft.com do?');

      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/questions/analyze`,
        {
          method: 'POST',
          headers: {
        'Content-Type': 'application/json',
          },
          body: JSON.stringify({ question: 'What does microsoft.com do?' }),
        }
      );
    });

    it('should throw error when response is not ok', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve('Server error')
      });

      await expect(analyzeQuestion('What does microsoft.com do?')).rejects.toThrow('Server error');
    });

    it('should throw default error when response text is empty', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve('')
      });

      await expect(analyzeQuestion('What does microsoft.com do?')).rejects.toThrow('Failed to analyze question');
    });
  });

  describe('getHistory', () => {
    it('should fetch history and transform data correctly', async () => {
      const mockData = [
        {
          id: '1',
          timestamp: '2023-01-01T00:00:00Z',
          question: 'What does microsoft.com do?',
          domain: 'microsoft.com',
          answer: 'Microsoft is a technology company'
        }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      const result = await getHistory();

      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/history`,
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result).toEqual([
        {
          id: '1',
          timestamp: new Date('2023-01-01T00:00:00Z'),
          question: { question: 'What does microsoft.com do?', domain: 'microsoft.com' },
          answer: { text: 'Microsoft is a technology company' }
        }
      ]);
    });

    it('should throw error when response is not ok', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve('Some error')
      });

      await expect(getHistory()).rejects.toThrow('Failed to fetch history');
    });
  });

  describe('saveHistory', () => {
    it('should save history and return transformed data', async () => {
      const mockData = {
        id: '1',
        timestamp: '2023-01-01T00:00:00Z',
        question: 'What does microsoft.com do?',
        domain: 'microsoft.com',
        answer: 'Microsoft is a technology company'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      const result = await saveHistory('What does microsoft.com do?', 'microsoft.com', 'Microsoft is a technology company');

      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/history`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: 'What does microsoft.com do?',
            domain: 'microsoft.com',
            answer: 'Microsoft is a technology company'
          }),
        }
      );

      expect(result).toEqual({
        id: '1',
        timestamp: new Date('2023-01-01T00:00:00Z'),
        question: { question: 'What does microsoft.com do?', domain: 'microsoft.com' },
        answer: { text: 'Microsoft is a technology company' }
      });
    });

    it('should throw error when response is not ok', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false
      });

      await expect(saveHistory('question', 'domain', 'answer')).rejects.toThrow('Failed to save history');
    });
  });
}); 