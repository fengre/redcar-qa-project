import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Question, Answer, HistoryItem } from '../../models/types';
import { QuestionController } from '../../controllers/questionController';
import { History } from './History';

export const QuestionForm = () => {
  const [question, setQuestion] = useState('');
  const [currentAnswer, setCurrentAnswer] = useState<Answer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const controller = QuestionController.getInstance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const answer = await controller.processQuestion(question);
      // Set the current answer
      setCurrentAnswer({ text: answer });

      // Add to history
      const historyItem: HistoryItem = {
        id: uuidv4(),
        timestamp: new Date(),
        question: { question, domain: '' },
        answer: { text: answer }
      };
      setHistory(prev => [historyItem, ...prev]);
    } catch (error: any) {
      setError(error.message || 'Failed to process question');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHistorySelect = (item: HistoryItem) => {
    setQuestion(item.question.question);
    setCurrentAnswer(item.answer);
  };

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="question" className="font-medium">
            Your Question:
          </label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about a company (e.g., 'What does microsoft.com do?')"
            className={`border rounded-md p-2 h-32 ${error ? 'border-red-500' : ''}`}
            required
          />
          {error && (
            <span className="text-red-500 text-sm mt-1">{error}</span>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="rounded-full bg-foreground text-background py-2 px-4 hover:bg-[#383838] disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 'Submit Question'}
        </button>
      </form>

      {/* Always show the answer section if there's a current answer */}
      {currentAnswer && (
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-4">Answer:</h2>
          <div className="border rounded-md p-4 bg-gray-50">
            {currentAnswer.text}
          </div>
        </div>
      )}

      {/* Show history below the current answer */}
      {history.length > 0 && (
        <History items={history} onSelect={handleHistorySelect} />
      )}
    </div>
  );
};