import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';
import { createMockHistoryItem } from '../utils/test-utils';

// Mock the QuestionForm component
jest.mock('../components/QuestionForm', () => ({
  QuestionForm: () => <div data-testid="question-form">Question Form Component</div>
}));

// Mock fetch to prevent AuthContext from making real API calls
let fetchMock: jest.SpyInstance;

describe('App Component', () => {
  beforeEach(() => {
    // Setup fetch mock to prevent real API calls
    fetchMock = jest.spyOn(window, 'fetch');
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: 'test-token', user: { id: '1', username: 'testuser', createdAt: '2024-01-01T00:00:00Z' } }),
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render the main title', () => {
    render(<App />);
    expect(screen.getByText('Company Question Analyzer')).toBeInTheDocument();
  });

  it('should render the QuestionForm component', () => {
    render(<App />);
    expect(screen.getByTestId('question-form')).toBeInTheDocument();
  });

  it('should have proper layout structure', () => {
    render(<App />);
    
    // Check for main container
    const mainElement = screen.getByRole('main');
    expect(mainElement).toBeInTheDocument();
    
    // Check for title
    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('Company Question Analyzer');
  });

  it('should have proper styling classes', () => {
    render(<App />);
    
    // Check main container classes
    const mainContainer = screen.getByRole('main');
    expect(mainContainer).toHaveClass('max-w-2xl', 'mx-auto', 'flex', 'flex-col', 'gap-8');
    
    // Check title classes
    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveClass('text-3xl', 'font-bold', 'text-center', 'text-gray-900');
    
    // Check form container classes
    const formContainer = screen.getByTestId('question-form').parentElement;
    expect(formContainer).toHaveClass('bg-white', 'p-6', 'rounded-lg', 'shadow');
  });

  it('should have proper page structure', () => {
    render(<App />);
    
    // Check for the main page wrapper
    const pageWrapper = screen.getByRole('main').parentElement;
    expect(pageWrapper).toHaveClass('min-h-screen', 'p-8', 'pb-20', 'gap-8', 'font-sans', 'bg-gray-50');
  });

  it('should be accessible', () => {
    render(<App />);
    
    // Check for proper heading hierarchy
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    
    // Check for main landmark
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });

  it('should render without crashing', () => {
    expect(() => render(<App />)).not.toThrow();
  });

  it('should have consistent layout on re-render', () => {
    const { rerender } = render(<App />);
    
    expect(screen.getByText('Company Question Analyzer')).toBeInTheDocument();
    expect(screen.getByTestId('question-form')).toBeInTheDocument();
    
    rerender(<App />);
    
    expect(screen.getByText('Company Question Analyzer')).toBeInTheDocument();
    expect(screen.getByTestId('question-form')).toBeInTheDocument();
  });
}); 