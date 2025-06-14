import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuestionForm } from '../QuestionForm';
import { QuestionController } from '../../../controllers/questionController';

jest.mock('../../../controllers/questionController');

describe('QuestionForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the form', () => {
    render(<QuestionForm />);
    expect(screen.getByLabelText(/your question/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('should show error for invalid question', async () => {
    render(<QuestionForm />);
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    const textArea = screen.getByLabelText(/your question/i);

    fireEvent.change(textArea, { target: { value: 'Invalid question without domain' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please include a company domain/i)).toBeInTheDocument();
    });
  });

  it('should handle successful submission', async () => {
    const mockStreamAnswer = jest.fn(async function* () {
      yield 'Test';
      yield ' response';
    });

    const mockProvider = {
      streamAnswer: mockStreamAnswer
    };

    jest.spyOn(QuestionController.prototype, 'getProvider').mockReturnValue(mockProvider);

    render(<QuestionForm />);
    
    const textArea = screen.getByLabelText(/your question/i);
    fireEvent.change(textArea, { target: { value: 'What does example.com do?' } });
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Test response')).toBeInTheDocument();
    });
  });
});