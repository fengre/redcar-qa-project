import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import * as api from '../api/api';

// Mock the API module
jest.mock('../api/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('Integration Tests', () => {
  let fetchMock: jest.SpyInstance;
  let localStorageMock: Record<string, string> = {};

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
    
    // Setup fetch mock for authentication
    fetchMock = jest.spyOn(window, 'fetch');
    localStorageMock = {};
    jest.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation((...args: unknown[]) => localStorageMock[String(args[0])] || null);
    jest.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation((...args: unknown[]) => { localStorageMock[String(args[0])] = String(args[1]); });
    jest.spyOn(window.localStorage.__proto__, 'removeItem').mockImplementation((...args: unknown[]) => { delete localStorageMock[String(args[0])]; });
    
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

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should complete full user workflow: ask question, get answer, save to history', async () => {
    // Mock authentication state
    const mockUser = { id: '1', username: 'testuser', createdAt: '2024-01-01T00:00:00Z' };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: 'token123', user: mockUser }),
    } as any);

    await act(async () => {
      render(<App />);
    });

    // Login first
    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByLabelText('Password');
    const loginButton = screen.getByRole('button', { name: 'Login' });

    await act(async () => {
      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(loginButton);
    });

    // Wait for login to complete
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Login' })).not.toBeInTheDocument();
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

    // Verify history is displayed (should be visible after saving)
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
    // Mock fetch to prevent AuthContext from making real API calls
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: 'test-token', user: { id: '1', username: 'testuser', createdAt: '2024-01-01T00:00:00Z' } }),
    } as any);

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
    // Mock fetch to prevent AuthContext from making real API calls
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: 'test-token', user: { id: '1', username: 'testuser', createdAt: '2024-01-01T00:00:00Z' } }),
    } as any);

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
    // Mock authentication state
    const mockUser = { id: '1', username: 'testuser', createdAt: '2024-01-01T00:00:00Z' };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: 'token123', user: mockUser }),
    } as any);

    await act(async () => {
      render(<App />);
    });

    // Login first
    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByLabelText('Password');
    const loginButton = screen.getByRole('button', { name: 'Login' });

    await act(async () => {
      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(loginButton);
    });

    // Wait for login to complete
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Login' })).not.toBeInTheDocument();
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
    // Mock fetch to prevent AuthContext from making real API calls
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: 'test-token', user: { id: '1', username: 'testuser', createdAt: '2024-01-01T00:00:00Z' } }),
    } as any);

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
    // Mock fetch to prevent AuthContext from making real API calls
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: 'test-token', user: { id: '1', username: 'testuser', createdAt: '2024-01-01T00:00:00Z' } }),
    } as any);

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

  describe('Authentication Integration Tests', () => {
    let fetchMock: jest.SpyInstance;
    let localStorageMock: Record<string, string> = {};

    beforeEach(() => {
      fetchMock = jest.spyOn(window, 'fetch');
      localStorageMock = {};
      jest.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation((...args: unknown[]) => localStorageMock[String(args[0])] || null);
      jest.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation((...args: unknown[]) => { localStorageMock[String(args[0])] = String(args[1]); });
      jest.spyOn(window.localStorage.__proto__, 'removeItem').mockImplementation((...args: unknown[]) => { delete localStorageMock[String(args[0])]; });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should show login modal when not authenticated', async () => {
      await act(async () => {
        render(<App />);
      });

      // Should show login modal
      expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      
      // Should not show main app content
      expect(screen.queryByText('UserInfo')).not.toBeInTheDocument();
    });

    it('should complete login flow successfully', async () => {
      const user = { id: '1', username: 'testuser', createdAt: '2024-01-01T00:00:00Z' };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ accessToken: 'token123', user }),
      } as any);

      await act(async () => {
        render(<App />);
      });

      // Fill login form
      const usernameInput = screen.getByLabelText('Username');
      const passwordInput = screen.getByLabelText('Password');
      const loginButton = screen.getByRole('button', { name: 'Login' });

      await act(async () => {
        await userEvent.type(usernameInput, 'testuser');
        await userEvent.type(passwordInput, 'password123');
        await userEvent.click(loginButton);
      });

      // Wait for login to complete
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Login' })).not.toBeInTheDocument();
      });

      // Should show authenticated UI
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText(/Member since/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
      
      // Should show main app content
      expect(screen.getByText('Company Question Analyzer')).toBeInTheDocument();
      expect(screen.getByLabelText('Your Question:')).toBeInTheDocument();
    });

    it('should complete registration flow successfully', async () => {
      const user = { id: '2', username: 'newuser', createdAt: '2024-01-02T00:00:00Z' };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ accessToken: 'token456', user }),
      } as any);

      await act(async () => {
        render(<App />);
      });

      // Switch to register mode
      const switchButton = screen.getByText(/don't have an account/i);
      await act(async () => {
        await userEvent.click(switchButton);
      });

      expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument();

      // Fill registration form
      const usernameInput = screen.getByLabelText('Username');
      const passwordInput = screen.getByLabelText('Password');
      const registerButton = screen.getByRole('button', { name: 'Register' });

      await act(async () => {
        await userEvent.type(usernameInput, 'newuser');
        await userEvent.type(passwordInput, 'password123');
        await userEvent.click(registerButton);
      });

      // Wait for registration to complete
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Register' })).not.toBeInTheDocument();
      });

      // Should show authenticated UI
      expect(screen.getByText('newuser')).toBeInTheDocument();
      expect(screen.getByText(/Member since/)).toBeInTheDocument();
    });

    it('should handle login error and show error message', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Invalid credentials',
      } as any);

      await act(async () => {
        render(<App />);
      });

      // Fill login form with invalid credentials
      const usernameInput = screen.getByLabelText('Username');
      const passwordInput = screen.getByLabelText('Password');
      const loginButton = screen.getByRole('button', { name: 'Login' });

      await act(async () => {
        await userEvent.type(usernameInput, 'baduser');
        await userEvent.type(passwordInput, 'badpass');
        await userEvent.click(loginButton);
      });

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });

      // Should still show login modal
      expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    });

    it('should handle registration error and show error message', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Username already exists',
      } as any);

      await act(async () => {
        render(<App />);
      });

      // Switch to register mode
      const switchButton = screen.getByText(/don't have an account/i);
      await act(async () => {
        await userEvent.click(switchButton);
      });

      // Fill registration form with existing username
      const usernameInput = screen.getByLabelText('Username');
      const passwordInput = screen.getByLabelText('Password');
      const registerButton = screen.getByRole('button', { name: 'Register' });

      await act(async () => {
        await userEvent.type(usernameInput, 'existinguser');
        await userEvent.type(passwordInput, 'password123');
        await userEvent.click(registerButton);
      });

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Username already exists')).toBeInTheDocument();
      });

      // Should still show register modal
      expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument();
    });

    it('should handle logout and return to login modal', async () => {
      const user = { id: '3', username: 'logoutuser', createdAt: '2024-01-03T00:00:00Z' };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ accessToken: 'token789', user }),
      } as any);

      await act(async () => {
        render(<App />);
      });

      // Login first
      const usernameInput = screen.getByLabelText('Username');
      const passwordInput = screen.getByLabelText('Password');
      const loginButton = screen.getByRole('button', { name: 'Login' });

      await act(async () => {
        await userEvent.type(usernameInput, 'logoutuser');
        await userEvent.type(passwordInput, 'password123');
        await userEvent.click(loginButton);
      });

      // Wait for login to complete
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Login' })).not.toBeInTheDocument();
      });

      // Click logout
      const logoutButton = screen.getByRole('button', { name: 'Logout' });
      await act(async () => {
        await userEvent.click(logoutButton);
      });

      // Should return to login modal
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
      });

      // Should not show authenticated UI
      expect(screen.queryByText('logoutuser')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Logout' })).not.toBeInTheDocument();
    });

    it('should persist authentication state across page reloads', async () => {
      const user = { id: '4', username: 'persistuser', createdAt: '2024-01-03T00:00:00Z' };
      
      // Mock localStorage with existing auth data
      localStorageMock['jwt'] = 'persisted-token';
      localStorageMock['user'] = JSON.stringify(user);

      await act(async () => {
        render(<App />);
      });

      // Should be authenticated immediately
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Login' })).not.toBeInTheDocument();
      });

      expect(screen.getByText('persistuser')).toBeInTheDocument();
      expect(screen.getByText(/Member since/)).toBeInTheDocument();
    });

    it('should clear form and error when switching between login and register', async () => {
      // Mock fetch to prevent AuthContext from making real API calls
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ accessToken: 'test-token', user: { id: '1', username: 'testuser', createdAt: '2024-01-01T00:00:00Z' } }),
      } as any);

      await act(async () => {
        render(<App />);
      });

      // Fill login form
      const usernameInput = screen.getByLabelText('Username');
      const passwordInput = screen.getByLabelText('Password');
      
      await act(async () => {
        await userEvent.type(usernameInput, 'testuser');
        await userEvent.type(passwordInput, 'password123');
      });

      // Switch to register
      const switchButton = screen.getByText(/don't have an account/i);
      await act(async () => {
        await userEvent.click(switchButton);
      });

      // Form should be cleared
      expect(usernameInput).toHaveValue('');
      expect(passwordInput).toHaveValue('');
      expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument();

      // Switch back to login
      const switchBackButton = screen.getByText(/already have an account/i);
      await act(async () => {
        await userEvent.click(switchBackButton);
      });

      // Form should still be cleared
      expect(usernameInput).toHaveValue('');
      expect(passwordInput).toHaveValue('');
      expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    });

    it('should show loading state during authentication', async () => {
      let resolvePromise: (value?: unknown) => void = () => {};
      fetchMock.mockImplementation(
        () => new Promise((resolve) => { resolvePromise = resolve; })
      );

      await act(async () => {
        render(<App />);
      });

      // Fill login form
      const usernameInput = screen.getByLabelText('Username');
      const passwordInput = screen.getByLabelText('Password');
      const loginButton = screen.getByRole('button', { name: 'Login' });

      await act(async () => {
        await userEvent.type(usernameInput, 'testuser');
        await userEvent.type(passwordInput, 'password123');
        await userEvent.click(loginButton);
      });

      // Should show loading state
      expect(screen.getByRole('button', { name: 'Loading...' })).toBeDisabled();

      // Resolve the promise
      resolvePromise();

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: 'Loading...' })).not.toBeInTheDocument();
      });
    });

    it('should handle network errors during authentication', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      await act(async () => {
        render(<App />);
      });

      // Fill login form
      const usernameInput = screen.getByLabelText('Username');
      const passwordInput = screen.getByLabelText('Password');
      const loginButton = screen.getByRole('button', { name: 'Login' });

      await act(async () => {
        await userEvent.type(usernameInput, 'testuser');
        await userEvent.type(passwordInput, 'password123');
        await userEvent.click(loginButton);
      });

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      // Should still show login modal
      expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    });
  });
}); 