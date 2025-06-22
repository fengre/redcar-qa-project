import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistoryItem } from './api/history.entity';
import { User } from './auth/user.entity';

// Mock fetch globally for tests
global.fetch = jest.fn();

// Common mock repository
export const createMockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
  query: jest.fn(),
});

// Common mock AI provider
export const createMockAiProvider = () => ({
  analyze: jest.fn(),
  streamAnalyze: jest.fn(),
});

// Common mock config service
export const createMockConfigService = () => ({
  get: jest.fn(),
});

// Test data factories
export const createTestUser = (overrides: Partial<User> = {}): User => ({
  id: '1',
  username: 'testuser',
  password: 'hashedpassword',
  createdAt: new Date(),
  ...overrides,
});

export const createTestHistoryItem = (overrides: Partial<HistoryItem> = {}): HistoryItem => ({
  id: '1',
  question: 'What does example.com do?',
  domain: 'example.com',
  answer: 'Example.com is a technology company.',
  timestamp: new Date(),
  userId: '1',
  user: createTestUser(),
  ...overrides,
});

export const createTestHistoryItems = (count: number): HistoryItem[] => {
  return Array.from({ length: count }, (_, index) =>
    createTestHistoryItem({
      id: String(index + 1),
      question: `Question ${index + 1}`,
      domain: `domain${index + 1}.com`,
      answer: `Answer ${index + 1}`,
      timestamp: new Date(`2023-01-${String(index + 1).padStart(2, '0')}T00:00:00Z`),
    })
  );
};

// Test question data
export const createTestQuestionData = (overrides: any = {}) => ({
  question: 'What does example.com do?',
  ...overrides,
});

// Test history data
export const createTestHistoryData = (overrides: any = {}) => ({
  question: 'What does example.com do?',
  domain: 'example.com',
  answer: 'Example.com is a technology company.',
  ...overrides,
});

// Mock response object for controller tests
export const createMockResponse = () => ({
  setHeader: jest.fn(),
  status: jest.fn().mockReturnThis(),
  write: jest.fn(),
  end: jest.fn(),
  json: jest.fn(),
  send: jest.fn(),
});

// Mock request object for controller tests
export const createMockRequest = (overrides: any = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  ...overrides,
});

// Async generator helper for testing streaming
export const createMockStreamGenerator = (chunks: string[]) => {
  return (async function* () {
    for (const chunk of chunks) {
      yield chunk;
    }
  })();
};

// Test module builder helper
export const createTestingModule = async (providers: any[], controllers: any[] = []) => {
  const module: TestingModule = await Test.createTestingModule({
    controllers,
    providers,
  }).compile();

  return module;
};

// Repository testing helper
export const createRepositoryTestingModule = async (
  entity: any,
  service: any,
  mockRepository: any = createMockRepository()
) => {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      service,
      {
        provide: getRepositoryToken(entity),
        useValue: mockRepository,
      },
    ],
  }).compile();

  return {
    module,
    service: module.get(service),
    repository: module.get<Repository<any>>(getRepositoryToken(entity)),
  };
};

// Validation helpers
export const expectValidDomain = (domain: string) => {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*(\.[a-zA-Z0-9][a-zA-Z0-9-]*)*\.[a-zA-Z]{2,}$/;
  expect(domainRegex.test(domain)).toBe(true);
};

export const expectValidTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  expect(date.getTime()).not.toBeNaN();
  expect(date).toBeInstanceOf(Date);
};

// Performance testing helpers
export const measureExecutionTime = async (fn: () => Promise<any>): Promise<number> => {
  const start = Date.now();
  await fn();
  const end = Date.now();
  return end - start;
};

export const runConcurrentRequests = async (
  requestFn: () => Promise<any>,
  count: number
): Promise<any[]> => {
  const requests = Array.from({ length: count }, () => requestFn());
  return Promise.all(requests);
};

// Error testing helpers
export const expectThrowsAsync = async (fn: () => Promise<any>, errorType?: any) => {
  try {
    await fn();
    throw new Error('Expected function to throw');
  } catch (error) {
    if (errorType) {
      expect(error).toBeInstanceOf(errorType);
    }
    return error;
  }
};

// Cleanup helpers
export const cleanupMocks = () => {
  jest.clearAllMocks();
  jest.resetAllMocks();
  jest.restoreAllMocks();
};

// Test environment setup
export const setupTestEnvironment = () => {
  beforeAll(() => {
    // Global test setup
  });

  afterAll(() => {
    // Global test cleanup
  });

  beforeEach(() => {
    cleanupMocks();
  });

  afterEach(() => {
    cleanupMocks();
  });
}; 