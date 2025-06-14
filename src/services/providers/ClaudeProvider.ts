import { AIProvider } from '../interfaces/AIProvider';
import { Question, Answer } from '../../models/types';

export class ClaudeProvider implements AIProvider {
  private apiKey: string;
  private baseUrl: string = 'https://api.anthropic.com/v1/messages';

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_CLAUDE_API_KEY || '';
  }

  async getAnswer(question: Question): Promise<Answer> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-latest',
          messages: [{
            role: 'user',
            content: question.question
          }],
          max_tokens: 1024
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to get answer from Claude');
      }

      return { text: data.content[0].text };
    } catch (error) {
      throw new Error('Claude API error: ' + error);
    }
  }
}