import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Question, HistoryItem } from '../../models/types';
import { QuestionController } from '../../controllers/questionController';
import { History } from './History';

export const QuestionForm = () => {
  const [question, setQuestion] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const controller = QuestionController.getInstance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStreamingText('');
    setIsLoading(true);

    try {
      const provider = controller.getProvider();
      let fullText = '';

      for await (const chunk of provider.streamAnswer({ question, domain: '' })) {
        fullText += chunk;
        setStreamingText(fullText);
      }

      // Add to history without limit
      const historyItem: HistoryItem = {
        id: uuidv4(),
        timestamp: new Date(),
        question: { question, domain: '' },
        answer: { text: fullText }
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
    setStreamingText(item.answer.text);
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

      {(streamingText || isLoading) && (
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-bold mb-4">Answer:</h2>
          <div className="prose max-w-none whitespace-pre-wrap">
            {streamingText}
            {isLoading && (
              <span className="inline-block w-2 h-4 ml-1 bg-foreground animate-pulse" />
            )}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <History items={history} onSelect={handleHistorySelect} />
      )}
    </div>
  );
};