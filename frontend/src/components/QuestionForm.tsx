import { useState, useEffect, useCallback } from 'react';
import { HistoryItem, extractDomain, validateDomain, analyzeQuestion, getHistory, saveHistory } from '../api';
import { History } from './History';

export const QuestionForm = () => {
  const [question, setQuestion] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      const historyData = await getHistory();
      setHistory(historyData);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }, []);

  // Load history on component mount
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStreamingText('');
    setIsLoading(true);

    try {
      const domain = extractDomain(question);
      if (!domain) {
        throw new Error('Please include a company domain in your question');
      }

      if (!validateDomain(domain)) {
        throw new Error('Invalid domain format');
      }

      // Get streaming response from backend
      const stream = await analyzeQuestion(question);
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        fullText += chunk;
        setStreamingText(fullText);
      }

      // Save to history
      const historyItem = await saveHistory(question, domain, fullText);
      setHistory(prev => [historyItem, ...prev]);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || 'Failed to process question');
      } else {
        setError('Failed to process question');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleHistorySelect = (item: HistoryItem) => {
    setQuestion(item.question.question);
    setStreamingText(item.answer.text);
    setError('');
  };

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="question" className="font-medium">Your Question:</label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about a company (e.g., 'What does microsoft.com do?')"
            className={`border rounded-md p-2 h-32 ${error ? 'border-red-500' : ''}`}
            required
          />
          {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="rounded-full bg-gray-700 text-white py-2 px-4 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isLoading ? 'Processing...' : 'Submit Question'}
        </button>
      </form>

      {(streamingText || isLoading) && (
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-bold mb-4">Answer:</h2>
          <div className="prose max-w-none whitespace-pre-wrap">
            {streamingText}
            {isLoading && <span className="inline-block w-2 h-4 ml-1 bg-gray-700 animate-pulse" />}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <History 
          items={history} 
          onSelect={handleHistorySelect}
        />
      )}
    </div>
  );
}; 