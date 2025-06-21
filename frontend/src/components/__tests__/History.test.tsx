import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { History } from '../History';
import { HistoryItem } from '../../api';

// Mock data
const mockHistoryItems: HistoryItem[] = [
  {
    id: '300',
    timestamp: new Date('2023-01-01T10:00:00Z'),
    question: { question: 'What does microsoft.com do?', domain: 'microsoft.com' },
    answer: { text: 'Microsoft is a technology company.' }
  },
  {
    id: '301',
    timestamp: new Date('2023-01-02T10:00:00Z'),
    question: { question: 'What does google.com do?', domain: 'google.com' },
    answer: { text: 'Google is a search company.' }
  }
];

describe('History Component', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render history title', () => {
    render(<History items={mockHistoryItems} onSelect={mockOnSelect} />);
    expect(screen.getByText('History')).toBeInTheDocument();
  });

  it('should render all history items', () => {
    render(<History items={mockHistoryItems} onSelect={mockOnSelect} />);
    
    expect(screen.getByText('What does microsoft.com do?')).toBeInTheDocument();
    expect(screen.getByText('What does google.com do?')).toBeInTheDocument();
  });

  it('should display timestamps in readable format', () => {
    render(<History items={mockHistoryItems} onSelect={mockOnSelect} />);
    
    // Check that timestamps are displayed (exact format may vary by locale)
    const timestamps = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
    expect(timestamps).toHaveLength(2);
  });

  it('should display truncated answer text', () => {
    render(<History items={mockHistoryItems} onSelect={mockOnSelect} />);
    
    // Should show truncated version of the answer
    expect(screen.getByText(/Microsoft is a technology company/)).toBeInTheDocument();
    expect(screen.getByText(/Google is a search company/)).toBeInTheDocument();
  });

  it('should call onSelect when history item is clicked', () => {
    render(<History items={mockHistoryItems} onSelect={mockOnSelect} />);
    
    const firstItem = screen.getByText('What does microsoft.com do?').closest('div');
    fireEvent.click(firstItem!);
    
    expect(mockOnSelect).toHaveBeenCalledWith(mockHistoryItems[0]);
  });

  it('should call onSelect with correct item when different items are clicked', () => {
    render(<History items={mockHistoryItems} onSelect={mockOnSelect} />);
    
    const secondItem = screen.getByText('What does google.com do?').closest('div');
    fireEvent.click(secondItem!);
    
    expect(mockOnSelect).toHaveBeenCalledWith(mockHistoryItems[1]);
  });

  it('should render empty state when no items are provided', () => {
    render(<History items={[]} onSelect={mockOnSelect} />);
    
    expect(screen.getByText('History')).toBeInTheDocument();
    // Should not render any history items
    expect(screen.queryByText(/What does/)).not.toBeInTheDocument();
  });

  it('should handle single history item', () => {
    const singleItem = [mockHistoryItems[0]];
    render(<History items={singleItem} onSelect={mockOnSelect} />);
    
    expect(screen.getByText('What does microsoft.com do?')).toBeInTheDocument();
    expect(screen.queryByText('What does google.com do?')).not.toBeInTheDocument();
  });

  it('should handle very long question text', () => {
    const longQuestionItem: HistoryItem = {
      id: '302',
      timestamp: new Date('2023-01-03T12:00:00Z'),
      question: { 
        question: 'This is a very long question that might exceed normal display limits and should be handled gracefully by the component', 
        domain: 'example.com' 
      },
      answer: { text: 'Short answer' }
    };
    
    render(<History items={[longQuestionItem]} onSelect={mockOnSelect} />);
    
    expect(screen.getByText(/This is a very long question/)).toBeInTheDocument();
  });

  it('should handle very long answer text', () => {
    const longAnswerItem: HistoryItem = {
      id: '303',
      timestamp: new Date('2023-01-04T12:00:00Z'),
      question: { question: 'Short question?', domain: 'example.com' },
      answer: { 
        text: 'This is a very long answer that should be truncated by the CSS truncate class. It contains many words and should not break the layout of the component when displayed in the history list.' 
      }
    };
    
    render(<History items={[longAnswerItem]} onSelect={mockOnSelect} />);
    
    expect(screen.getByText(/This is a very long answer/)).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<History items={mockHistoryItems} onSelect={mockOnSelect} />);
    
    const historyItems = screen.getAllByText(/What does|What does/);
    historyItems.forEach(item => {
      // Find the parent div that has the cursor-pointer class
      const container = item.closest('div[class*="cursor-pointer"]');
      expect(container).toHaveClass('cursor-pointer');
    });
  });

  it('should handle click events on different parts of the item', () => {
    render(<History items={mockHistoryItems} onSelect={mockOnSelect} />);
    
    // Click on the question text
    fireEvent.click(screen.getByText('What does microsoft.com do?'));
    expect(mockOnSelect).toHaveBeenCalledWith(mockHistoryItems[0]);
    
    // Click on the answer text
    fireEvent.click(screen.getByText(/Microsoft is a technology company/));
    expect(mockOnSelect).toHaveBeenCalledWith(mockHistoryItems[0]);
  });

  it('should handle special characters in question and answer', () => {
    const specialCharItem: HistoryItem = {
      id: '304',
      timestamp: new Date('2023-01-05T12:00:00Z'),
      question: { question: 'What does test.com do? (with parentheses & symbols!)', domain: 'test.com' },
      answer: { text: 'Answer with "quotes" & <special> characters' }
    };
    
    render(<History items={[specialCharItem]} onSelect={mockOnSelect} />);
    
    expect(screen.getByText(/What does test.com do\? \(with parentheses & symbols!\)/)).toBeInTheDocument();
    expect(screen.getByText(/Answer with "quotes" & <special> characters/)).toBeInTheDocument();
  });
}); 