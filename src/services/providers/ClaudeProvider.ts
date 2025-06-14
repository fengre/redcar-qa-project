import { AIProvider } from '../interfaces/AIProvider';
import { Question, Answer } from '../../models/types';

export class ClaudeProvider implements AIProvider {
  private apiKey: string;
  private baseUrl: string = 'https://api.anthropic.com/v1/messages';

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_CLAUDE_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('Claude API key is not configured');
    }
  }

  async *streamAnswer(question: Question): AsyncGenerator<string, void, unknown> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'messages-2024-01-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          messages: [{
            role: 'user',
            content: question.question
          }],
          max_tokens: 1024,
          stream: true
        })
      });

      if (!response.ok || !response.body) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to stream answer from Claude');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim() !== '');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'content_block_delta' && data.delta?.text) {
                  yield data.delta.text;
                }
              } catch {
                // Ignore malformed JSON
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Claude streaming error:', error);
      throw error;
    }
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
          model: 'claude-3-sonnet-20240229',
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

      if (!data.content?.[0]?.text) {
        throw new Error('Invalid response format from Claude');
      }

      return { text: data.content[0].text };
    } catch (error) {
      console.error('Claude API error:', error);
      throw error;
    }
  }
}