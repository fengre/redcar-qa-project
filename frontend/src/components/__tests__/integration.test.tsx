import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import * as api from '../../api';

// Mock the API module
jest.mock('../../api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('Integration Tests', () => {
  const mockHistoryItems = [
    {
      id: '200',
      timestamp: new Date('2023-01-01T10:00:00Z'),
      question: { question: 'What does microsoft.com do?', domain: 'microsoft.com' },
      answer: { text: 'Microsoft is a technology company.' }
    },
    {
      id: '201',
      timestamp: new Date('2023-01-02T10:00:00Z'),
      question: { question: 'What does google.com do?', domain: 'google.com' },
      answer: { text: 'Google is a search company.' }
    },
    {
      id: '202',
      timestamp: new Date('2023-01-03T10:00:00Z'),
      question: { question: 'What does apple.com do?', domain: 'apple.com' },
      answer: { text: 'Apple makes computers and phones.' }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockedApi.getHistory.mockResolvedValue(mockHistoryItems);
    mockedApi.extractDomain.mockImplementation((question: string) => {
      if (!question || question.trim() === '') return null;
      if (question.includes('microsoft.com')) return 'microsoft.com';
      if (question.includes('google.com')) return 'google.com';
      return null;
    });
    mockedApi.validateDomain.mockReturnValue(true);
    
    // Mock analyzeQuestion to return a proper streaming response
    mockedApi.analyzeQuestion.mockImplementation(async () => {
      return new ReadableStream({
        start(controller) {
          const text = 'Microsoft is a technology company';
          const encoder = new TextEncoder();
          // Send the text immediately
          controller.enqueue(encoder.encode(text));
          controller.close();
        }
      });
    });
    
    // Mock saveHistory to return unique IDs each time
    let saveHistoryIdCounter = 203;
    mockedApi.saveHistory.mockImplementation(async () => {
      const id = String(saveHistoryIdCounter++);
      return {
        id,
        timestamp: new Date('2023-01-03T10:00:00Z'),
        question: { question: 'What does microsoft.com do?', domain: 'microsoft.com' },
        answer: { text: 'Microsoft is a technology company.' }
      };
    });
  });

  it('should complete full user workflow: ask question, get answer, save to history', async () => {
    await act(async () => {
      render(<App />);
    });

    // Wait for app to load
    await waitFor(() => {
      expect(screen.getByText('Company Question Analyzer')).toBeInTheDocument();
    });

    // Find and fill the question form
    const textarea = screen.getByLabelText('Your Question:');
    const submitButton = screen.getByRole('button', { name: 'Submit Question' });

    await act(async () => {
      await userEvent.type(textarea, 'What does microsoft.com do?');
      await userEvent.click(submitButton);
    });

    // Wait for answer to appear
    await waitFor(() => {
      expect(screen.getByText('Answer:')).toBeInTheDocument();
      expect(screen.getByText('Microsoft is a technology company')).toBeInTheDocument();
    });

    // Verify history was saved
    expect(mockedApi.saveHistory).toHaveBeenCalledWith(
      'What does microsoft.com do?',
      'microsoft.com',
      'Microsoft is a technology company'
    );

    // Verify history is displayed
    await waitFor(() => {
      expect(screen.getByText('History')).toBeInTheDocument();
    });
  });

  it('should handle error workflow and recovery', async () => {
    // First, mock an error response
    mockedApi.extractDomain.mockReturnValueOnce(null);
    
    await act(async () => {
      render(<App />);
    });

    const textarea = screen.getByLabelText('Your Question:');
    const submitButton = screen.getByRole('button', { name: 'Submit Question' });

    // Submit invalid question
    await act(async () => {
      await userEvent.type(textarea, 'What is the weather like?');
      await userEvent.click(submitButton);
    });

    // Verify error is shown
    await waitFor(() => {
      expect(screen.getByText('Please include a company domain in your question')).toBeInTheDocument();
    });

    // Now submit a valid question
    await act(async () => {
      await userEvent.clear(textarea);
      await userEvent.type(textarea, 'What does microsoft.com do?');
      await userEvent.click(submitButton);
    });

    // Verify error is cleared and success occurs
    await waitFor(() => {
      expect(screen.queryByText('Please include a company domain in your question')).not.toBeInTheDocument();
      expect(screen.getByText('Answer:')).toBeInTheDocument();
      expect(screen.getByText('Microsoft is a technology company')).toBeInTheDocument();
    });
  });

  it('should handle multiple rapid submissions', async () => {
    await act(async () => {
      render(<App />);
    });

    const textarea = screen.getByLabelText('Your Question:');
    const submitButton = screen.getByRole('button', { name: 'Submit Question' });

    // Submit first question
    await act(async () => {
      await userEvent.type(textarea, 'What does microsoft.com do?');
      await userEvent.click(submitButton);
    });

    // Wait for first submission to complete
    await waitFor(() => {
      expect(screen.getByText('Answer:')).toBeInTheDocument();
    });

    // Submit second question
    await act(async () => {
      await userEvent.clear(textarea);
      await userEvent.type(textarea, 'What does google.com do?');
      await userEvent.click(submitButton);
    });

    // Verify both submissions were processed
    await waitFor(() => {
      expect(mockedApi.analyzeQuestion).toHaveBeenCalledTimes(2);
    });
  });

  it('should maintain state consistency across component interactions', async () => {
    await act(async () => {
      render(<App />);
    });

    const textarea = screen.getByLabelText('Your Question:');
    const submitButton = screen.getByRole('button', { name: 'Submit Question' });

    // Submit a question
    await act(async () => {
      await userEvent.type(textarea, 'What does microsoft.com do?');
      await userEvent.click(submitButton);
    });

    // Wait for answer
    await waitFor(() => {
      expect(screen.getByText('Answer:')).toBeInTheDocument();
    });

    // Verify form state is maintained
    expect(textarea).toHaveValue('What does microsoft.com do?');

    // Clear form and verify state updates
    await act(async () => {
      await userEvent.clear(textarea);
    });

    expect(textarea).toHaveValue('');
  });

  it('should handle history interactions', async () => {
    await act(async () => {
      render(<App />);
    });

    // Wait for history to load
    await waitFor(() => {
      expect(screen.getByText('History')).toBeInTheDocument();
    });

    // Find and click on a history item
    const historyItems = screen.getAllByText('What does microsoft.com do?');
    if (historyItems.length > 0) {
      await act(async () => {
        await userEvent.click(historyItems[0]);
      });

      // Verify form is populated with history data
      const textarea = screen.getByLabelText('Your Question:') as HTMLTextAreaElement;
      expect(textarea.value).toBe('What does microsoft.com do?');
    }
  });

  it('should handle network errors gracefully', async () => {
    // Mock network error
    mockedApi.getHistory.mockRejectedValueOnce(new Error('Network error'));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Should not crash the app
    await act(async () => {
      render(<App />);
    });

    // App should still render
    expect(screen.getByText('Company Question Analyzer')).toBeInTheDocument();
    consoleErrorSpy.mockRestore();
  });

  it('should handle streaming response properly', async () => {
    // Mock a streaming response with multiple chunks
    mockedApi.analyzeQuestion.mockImplementation(async () => {
      return new ReadableStream({
        start(controller) {
          const chunks = ['Microsoft', ' is a ', 'technology company'];
          const encoder = new TextEncoder();
          
          chunks.forEach((chunk, index) => {
            setTimeout(() => {
              controller.enqueue(encoder.encode(chunk));
              if (index === chunks.length - 1) {
                controller.close();
              }
            }, index * 10);
          });
        }
      });
    });

    await act(async () => {
      render(<App />);
    });

    const textarea = screen.getByLabelText('Your Question:');
    const submitButton = screen.getByRole('button', { name: 'Submit Question' });

    await act(async () => {
      await userEvent.type(textarea, 'What does microsoft.com do?');
      await userEvent.click(submitButton);
    });

    // Wait for final answer
    await waitFor(() => {
      expect(screen.getByText('Microsoft is a technology company')).toBeInTheDocument();
    });
  });
}); 