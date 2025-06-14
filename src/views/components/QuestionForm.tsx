import { useState } from 'react';
import { QuestionController } from '../../controllers/questionController';

export const QuestionForm = () => {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const controller = QuestionController.getInstance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult('');
    setIsLoading(true);

    try {
      const answer = await controller.processQuestion(question);
      setResult(answer);
    } catch (error: any) {
      setError(error.message || 'Failed to process question');
    } finally {
      setIsLoading(false);
    }
  };

  return (
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

      {result && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Answer:</h2>
          <div className="border rounded-md p-4 bg-gray-50">
            {result}
          </div>
        </div>
      )}
    </form>
  );
};