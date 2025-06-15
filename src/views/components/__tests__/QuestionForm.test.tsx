import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuestionForm } from '../QuestionForm';
import { QuestionController } from '../../../controllers/questionController';

jest.mock('../../../controllers/questionController');

describe('QuestionForm', () => {
  const mockStreamAnswer = jest.fn();
  const mockGetProvider = jest.fn();
  const mockValidateQuestion = jest.fn();
  const mockExtractDomain = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (QuestionController.getInstance as jest.Mock).mockReturnValue({
      getProvider: mockGetProvider,
      validateQuestion: mockValidateQuestion,
      extractDomain: mockExtractDomain
    });
  });

  it('should render form elements', () => {
    render(<QuestionForm />);
    expect(screen.getByLabelText(/your question/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('should handle validation errors', async () => {
    mockValidateQuestion.mockReturnValue({ 
      isValid: false, 
      error: 'Test error' 
    });

    render(<QuestionForm />);
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText('Test error')).toBeInTheDocument();
  });

  it('should handle successful submission', async () => {
    mockValidateQuestion.mockReturnValue({ isValid: true });
    mockExtractDomain.mockReturnValue('example.com');
    
    const mockStreamGenerator = async function* () {
      yield 'Test';
      yield ' response';
    };
    
    mockGetProvider.mockReturnValue({ streamAnswer: mockStreamGenerator });

    render(<QuestionForm />);
    
    const textArea = screen.getByLabelText(/your question/i);
    fireEvent.change(textArea, { target: { value: 'What does example.com do?' } });
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/Test response/)).toBeInTheDocument();
    });
  });

  it('should handle streaming errors', async () => {
    mockValidateQuestion.mockReturnValue({ isValid: true });
    mockExtractDomain.mockReturnValue('example.com');
    
    mockGetProvider.mockReturnValue({
      streamAnswer: async function* () {
        throw new Error('Stream error');
      }
    });

    render(<QuestionForm />);
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    });

    expect(await screen.findByText(/Stream error/)).toBeInTheDocument();
  });

  it('should update history after successful response', async () => {
    mockValidateQuestion.mockReturnValue({ isValid: true });
    mockExtractDomain.mockReturnValue('example.com');
    
    mockGetProvider.mockReturnValue({
      streamAnswer: async function* () {
        yield 'History test response';
      }
    });

    render(<QuestionForm />);
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/History test response/)).toBeInTheDocument();
    });
  });
});