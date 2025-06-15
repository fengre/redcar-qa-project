import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuestionForm } from '../question-form';
import { QuestionController } from '../../../controllers/question-controller';
import { MultiStepAIProcessor } from '../../../services/multi-step-ai-processor';

// Mock dependencies
jest.mock('../../../controllers/questionController');
jest.mock('../../../services/MultiStepAIProcessor');

describe('QuestionForm', () => {
    let mockController: jest.Mocked<QuestionController>;
    let mockProcessor: jest.Mocked<MultiStepAIProcessor>;

    beforeEach(() => {
        // Setup controller mock with getProvider
        mockController = {
            extractDomain: jest.fn(),
            getProvider: jest.fn()
        } as unknown as jest.Mocked<QuestionController>;

        (QuestionController.getInstance as jest.Mock).mockReturnValue(mockController);

        // Setup processor mock
        mockProcessor = {
            process: jest.fn()
        } as unknown as jest.Mocked<MultiStepAIProcessor>;

        (MultiStepAIProcessor as jest.Mock).mockImplementation(() => mockProcessor);
    });

    it('renders form elements', () => {
        render(<QuestionForm />);
        
        expect(screen.getByRole('textbox')).toBeInTheDocument();
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('shows error for invalid domain', async () => {
        // Arrange
        mockController.extractDomain.mockReturnValue(null);
        render(<QuestionForm />);

        // Act
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'invalid question' } });
        fireEvent.click(screen.getByRole('button'));

        // Assert
        expect(await screen.findByText(/please include a company domain/i)).toBeInTheDocument();
    });

    it('processes valid question', async () => {
        // Arrange
        const testQuestion = 'What does example.com do?';
        const testAnswer = 'Company information';
        
        mockController.extractDomain.mockReturnValue('example.com');
        mockController.getProvider.mockReturnValue({
            getAnswer: jest.fn(),
            streamAnswer: jest.fn()
        });
        mockProcessor.process.mockImplementation(async function* () {
            yield testAnswer;
        });

        render(<QuestionForm />);

        // Act
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: testQuestion } });
        fireEvent.click(screen.getByRole('button'));

        // Assert
        const answerElement = await screen.findByText((content, element) => {
            return !!element && element.className.includes('prose') && content.includes(testAnswer);
        });
        expect(answerElement).toBeInTheDocument();
    });
});