import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';

// Custom render function that includes providers if needed
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { ...options });

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Test data factories
export const createMockHistoryItem = (overrides = {}) => ({
  id: '1',
  timestamp: new Date('2023-01-01T10:00:00Z'),
  question: { question: 'What does microsoft.com do?', domain: 'microsoft.com' },
  answer: { text: 'Microsoft is a technology company.' },
  ...overrides,
});

export const createMockStreamResponse = (text: string) => 
  new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text));
      controller.close();
    }
  });

// Common test constants
export const TEST_CONSTANTS = {
  VALID_QUESTIONS: [
    'What does microsoft.com do?',
    'Tell me about apple.com',
    'What is the purpose of google.com?',
    'Can you explain what amazon.com does?',
  ],
  INVALID_QUESTIONS: [
    'What is the weather like?',
    'How are you today?',
    'Tell me a joke',
    '',
  ],
  VALID_DOMAINS: [
    'microsoft.com',
    'apple.com',
    'google.com',
    'amazon.com',
    'github.io',
    'example.org',
    'test.net',
  ],
  INVALID_DOMAINS: [
    'invalid-domain.xyz',
    'test.invalid',
    '-example.com',
    'example-.com',
    'exa--mple.com',
    'a.com',
    '',
  ],
};

// Helper functions for common test scenarios
export const setupMockApi = (api: any) => {
  const mockHistoryItems = [createMockHistoryItem()];
  const mockStreamResponse = createMockStreamResponse('Test response');
  
  api.getHistory.mockResolvedValue(mockHistoryItems);
  api.extractDomain.mockReturnValue('microsoft.com');
  api.validateDomain.mockReturnValue(true);
  api.analyzeQuestion.mockResolvedValue(mockStreamResponse);
  api.saveHistory.mockResolvedValue(mockHistoryItems[0]);
  
  return {
    mockHistoryItems,
    mockStreamResponse,
  };
};

export const waitForLoadingToFinish = async () => {
  // Wait for any loading states to finish
  await new Promise(resolve => setTimeout(resolve, 0));
};

export const mockConsoleError = () => {
  const originalError = console.error;
  const mockError = jest.fn();
  console.error = mockError;
  
  return {
    mockError,
    restore: () => {
      console.error = originalError;
    },
  };
}; 