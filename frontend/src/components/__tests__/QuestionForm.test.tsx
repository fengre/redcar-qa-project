import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionForm } from '../QuestionForm';
import { extractDomain, validateDomain, analyzeQuestion, getHistory, saveHistory } from '../../api/api';
import { createMockHistoryItem, setupMockApi, waitForLoadingToFinish } from '../../utils/test-utils';
import { AuthProvider } from '../../auth/AuthContext';

// Mock the API module
jest.mock('../../api/api');
const mockedApi = {
  extractDomain: extractDomain as jest.MockedFunction<typeof extractDomain>,
  validateDomain: validateDomain as jest.MockedFunction<typeof validateDomain>,
  analyzeQuestion: analyzeQuestion as jest.MockedFunction<typeof analyzeQuestion>,
  getHistory: getHistory as jest.MockedFunction<typeof getHistory>,
  saveHistory: saveHistory as jest.MockedFunction<typeof saveHistory>,
};

// Mock the History component
jest.mock('../History', () => ({
  History: ({ items, onSelect }: any) => (
    <div data-testid="history-component">
      {items.map((item: any) => (
        <div key={item.id} onClick={() => onSelect(item)} data-testid={`history-item-${item.id}`}>
          {item.question.question}
        </div>
      ))}
    </div>
  )
}));

// Helper function to render QuestionForm with AuthProvider
const renderWithAuth = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
};

describe('QuestionForm Component', () => {
  const mockHistoryItems = [
    {
      id: '100',
      timestamp: new Date('2023-01-01T10:00:00Z'),
      question: { question: 'What does microsoft.com do?', domain: 'microsoft.com' },
      answer: { text: 'Microsoft is a technology company.' }
    },
    {
      id: '101',
      timestamp: new Date('2023-01-02T10:00:00Z'),
      question: { question: 'What does google.com do?', domain: 'google.com' },
      answer: { text: 'Google is a search company.' }
    },
    {
      id: '102',
      timestamp: new Date('2023-01-03T10:00:00Z'),
      question: { question: 'What does apple.com do?', domain: 'apple.com' },
      answer: { text: 'Apple makes computers and phones.' }
    }
  ];

  const mockStreamResponse = new ReadableStream({
    start(controller) {
      // Send the text in chunks to simulate streaming
      const text = 'Microsoft is a technology company';
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(text));
      controller.close();
    }
  });

  beforeEach(() => {
    // Mock authentication in localStorage
    localStorage.setItem('jwt', 'test-token');
    localStorage.setItem('user', JSON.stringify({ id: '1', username: 'testuser', createdAt: '2024-01-01T00:00:00Z' }));

    jest.clearAllMocks();
    
    // Setup default mocks
    mockedApi.getHistory.mockResolvedValue(mockHistoryItems);
    mockedApi.extractDomain.mockImplementation((question: string) => {
      if (!question || question.trim() === '') return null;
      return 'microsoft.com';
    });
    mockedApi.validateDomain.mockReturnValue(true);
    
    // Mock analyzeQuestion to directly simulate the streaming response
    mockedApi.analyzeQuestion.mockImplementation(async () => {
      // Create a simple mock stream that returns the text immediately
      return new ReadableStream({
        start(controller) {
          const text = 'Microsoft is a technology company';
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode(text));
          controller.close();
        }
      });
    });
    
    // Return a new history item with a unique ID to prevent duplicates
    let saveHistoryIdCounter = 103;
    mockedApi.saveHistory.mockImplementation(async () => {
      const id = String(saveHistoryIdCounter++);
      return {
        id,
        timestamp: new Date('2023-01-02T10:00:00Z'),
        question: { question: 'What does microsoft.com do?', domain: 'microsoft.com' },
        answer: { text: 'Microsoft is a technology company.' }
      };
    });
  });

  afterEach(() => {
    // Clean up localStorage
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
  });

  it('should render the form with all elements', async () => {
    await act(async () => {
      renderWithAuth(<QuestionForm />);
    });
    
    expect(screen.getByLabelText('Your Question:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit Question' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ask a question about a company/)).toBeInTheDocument();
  });

  it('should load history on component mount', async () => {
    await act(async () => {
      renderWithAuth(<QuestionForm />);
    });
    
    await waitFor(() => {
      expect(mockedApi.getHistory).toHaveBeenCalled();
    });
  });

  it('should handle form submission with valid question', async () => {
    await act(async () => {
      renderWithAuth(<QuestionForm />);
    });
    
    const textarea = screen.getByLabelText('Your Question:');
    const submitButton = screen.getByRole('button', { name: 'Submit Question' });
    
    await act(async () => {
      await userEvent.type(textarea, 'What does microsoft.com do?');
      await userEvent.click(submitButton);
    });
    
    await waitFor(() => {
      expect(mockedApi.extractDomain).toHaveBeenCalledWith('What does microsoft.com do?');
      expect(mockedApi.validateDomain).toHaveBeenCalledWith('microsoft.com');
      expect(mockedApi.analyzeQuestion).toHaveBeenCalledWith('What does microsoft.com do?');
    });
  });

  it('should display streaming response', async () => {
    await act(async () => {
      renderWithAuth(<QuestionForm />);
    });
    
    const textarea = screen.getByLabelText('Your Question:');
    const submitButton = screen.getByRole('button', { name: 'Submit Question' });
    
    await act(async () => {
      await userEvent.type(textarea, 'What does microsoft.com do?');
      await userEvent.click(submitButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Answer:')).toBeInTheDocument();
      expect(screen.getByText('Microsoft is a technology company')).toBeInTheDocument();
    });
  });

  it('should show loading state during submission', async () => {
    // Mock a delayed response
    mockedApi.analyzeQuestion.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockStreamResponse), 100))
    );
    
    await act(async () => {
      renderWithAuth(<QuestionForm />);
    });
    
    const textarea = screen.getByLabelText('Your Question:');
    const submitButton = screen.getByRole('button', { name: 'Submit Question' });
    
    await act(async () => {
      await userEvent.type(textarea, 'What does microsoft.com do?');
      await userEvent.click(submitButton);
    });
    
    expect(screen.getByRole('button', { name: 'Processing...' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Processing...' })).toBeDisabled();
  });

  it('should show error when no domain is found', async () => {
    mockedApi.extractDomain.mockReturnValue(null);
    
    await act(async () => {
      renderWithAuth(<QuestionForm />);
    });
    
    const textarea = screen.getByLabelText('Your Question:');
    const submitButton = screen.getByRole('button', { name: 'Submit Question' });
    
    await act(async () => {
      await userEvent.type(textarea, 'What is the weather like?');
      await userEvent.click(submitButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Please include a company domain in your question')).toBeInTheDocument();
    });
  });

  it('should show error when domain is invalid', async () => {
    mockedApi.validateDomain.mockReturnValue(false);
    
    await act(async () => {
      renderWithAuth(<QuestionForm />);
    });
    
    const textarea = screen.getByLabelText('Your Question:');
    const submitButton = screen.getByRole('button', { name: 'Submit Question' });
    
    await act(async () => {
      await userEvent.type(textarea, 'What does invalid-domain.xyz do?');
      await userEvent.click(submitButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Invalid domain format')).toBeInTheDocument();
    });
  });

  it('should show error when API call fails', async () => {
    mockedApi.analyzeQuestion.mockRejectedValue(new Error('API Error'));
    
    await act(async () => {
      renderWithAuth(<QuestionForm />);
    });
    
    const textarea = screen.getByLabelText('Your Question:');
    const submitButton = screen.getByRole('button', { name: 'Submit Question' });
    
    await act(async () => {
      await userEvent.type(textarea, 'What does microsoft.com do?');
      await userEvent.click(submitButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('should save to history after successful submission', async () => {
    await act(async () => {
      renderWithAuth(<QuestionForm />);
    });
    
    const textarea = screen.getByLabelText('Your Question:');
    const submitButton = screen.getByRole('button', { name: 'Submit Question' });
    
    await act(async () => {
      await userEvent.type(textarea, 'What does microsoft.com do?');
      await userEvent.click(submitButton);
    });
    
    // Wait for the streaming response to complete and saveHistory to be called
    await waitFor(() => {
      expect(screen.getByText('Answer:')).toBeInTheDocument();
      expect(screen.getByText('Microsoft is a technology company')).toBeInTheDocument();
    });
    
    // Verify saveHistory was called with the correct parameters
    await waitFor(() => {
      expect(mockedApi.saveHistory).toHaveBeenCalledWith(
        'What does microsoft.com do?',
        'microsoft.com',
        'Microsoft is a technology company'
      );
    });
  });

  it('should display history component when history exists', async () => {
    await act(async () => {
      renderWithAuth(<QuestionForm />);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('history-component')).toBeInTheDocument();
    });
  });

  it('should handle history item selection', async () => {
    await act(async () => {
      renderWithAuth(<QuestionForm />);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('history-component')).toBeInTheDocument();
    });
    
    const historyItem = screen.getByTestId('history-item-100');
    await act(async () => {
      await userEvent.click(historyItem);
    });
    
    expect(screen.getByDisplayValue('What does microsoft.com do?')).toBeInTheDocument();
    expect(screen.getByText('Microsoft is a technology company.')).toBeInTheDocument();
  });

  it('should clear error when new submission starts', async () => {
    mockedApi.extractDomain.mockReturnValueOnce(null).mockReturnValue('microsoft.com');
    
    await act(async () => {
      renderWithAuth(<QuestionForm />);
    });
    
    const textarea = screen.getByLabelText('Your Question:');
    const submitButton = screen.getByRole('button', { name: 'Submit Question' });
    
    // First submission with error
    await act(async () => {
      await userEvent.type(textarea, 'What is the weather?');
      await userEvent.click(submitButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Please include a company domain in your question')).toBeInTheDocument();
    });
    
    // Clear textarea and submit valid question
    await act(async () => {
      await userEvent.clear(textarea);
      await userEvent.type(textarea, 'What does microsoft.com do?');
      await userEvent.click(submitButton);
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Please include a company domain in your question')).not.toBeInTheDocument();
    });
  });

  it('should handle empty question submission', async () => {
    await act(async () => {
      renderWithAuth(<QuestionForm />);
    });
    
    const submitButton = screen.getByRole('button', { name: 'Submit Question' });
    await act(async () => {
      await userEvent.click(submitButton);
    });
    
    // The form will submit but extractDomain should return null for empty string
    await waitFor(() => {
      expect(mockedApi.extractDomain).toHaveBeenCalledWith('');
    });
    
    // Should show error about missing domain
    await waitFor(() => {
      expect(screen.getByText('Please include a company domain in your question')).toBeInTheDocument();
    });
  });

  it('should handle history loading error gracefully', async () => {
    mockedApi.getHistory.mockRejectedValue(new Error('Failed to load history'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await act(async () => {
      renderWithAuth(<QuestionForm />);
    });
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load history:', expect.any(Error));
    });
    consoleSpy.mockRestore();
  });

  it('should handle save history error gracefully', async () => {
    mockedApi.saveHistory.mockRejectedValue(new Error('Failed to save'));
    
    await act(async () => {
      renderWithAuth(<QuestionForm />);
    });
    
    const textarea = screen.getByLabelText('Your Question:');
    const submitButton = screen.getByRole('button', { name: 'Submit Question' });
    
    await act(async () => {
      await userEvent.type(textarea, 'What does microsoft.com do?');
      await userEvent.click(submitButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Failed to save')).toBeInTheDocument();
    });
  });

  it('should show loading indicator during streaming', async () => {
    // Mock a streaming response that takes time
    let resolveStream: () => void;
    const streamPromise = new Promise<ReadableStream>(resolve => {
      resolveStream = () => resolve(mockStreamResponse);
    });
    mockedApi.analyzeQuestion.mockReturnValue(streamPromise);
    
    await act(async () => {
      renderWithAuth(<QuestionForm />);
    });
    
    const textarea = screen.getByLabelText('Your Question:');
    const submitButton = screen.getByRole('button', { name: 'Submit Question' });
    
    await act(async () => {
      await userEvent.type(textarea, 'What does microsoft.com do?');
      await userEvent.click(submitButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Answer:')).toBeInTheDocument();
    });
    
    // Should show loading indicator
    expect(screen.getByText(/Processing\.\.\./)).toBeInTheDocument();
    
    // Resolve the stream
    resolveStream!();
    
    await waitFor(() => {
      expect(screen.queryByText(/Processing\.\.\./)).not.toBeInTheDocument();
    });
  });

  it('should handle form validation', async () => {
    await act(async () => {
      renderWithAuth(<QuestionForm />);
    });
    
    const textarea = screen.getByLabelText('Your Question:');
    const submitButton = screen.getByRole('button', { name: 'Submit Question' });
    
    // Test required validation - form will submit but should show error
    await act(async () => {
      await userEvent.click(submitButton);
    });
    
    // Should call extractDomain with empty string and show error
    await waitFor(() => {
      expect(mockedApi.extractDomain).toHaveBeenCalledWith('');
      expect(screen.getByText('Please include a company domain in your question')).toBeInTheDocument();
    });
  });

  it('should update textarea value on change', async () => {
    await act(async () => {
      renderWithAuth(<QuestionForm />);
    });
    
    const textarea = screen.getByLabelText('Your Question:');
    await act(async () => {
      await userEvent.type(textarea, 'What does microsoft.com do?');
    });
    
    expect(textarea).toHaveValue('What does microsoft.com do?');
  });

  it('should show error styling on textarea when error exists', async () => {
    mockedApi.extractDomain.mockReturnValue(null);
    
    await act(async () => {
      renderWithAuth(<QuestionForm />);
    });
    
    const textarea = screen.getByLabelText('Your Question:');
    const submitButton = screen.getByRole('button', { name: 'Submit Question' });
    
    await act(async () => {
      await userEvent.type(textarea, 'What is the weather?');
      await userEvent.click(submitButton);
    });
    
    await waitFor(() => {
      expect(textarea).toHaveClass('border-red-500');
    });
  });
}); 