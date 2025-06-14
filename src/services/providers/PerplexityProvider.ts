import { AIProvider } from '../interfaces/AIProvider';
import { Question, Answer } from '../../models/types';

export class PerplexityProvider implements AIProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY || '';
  }

  async getAnswer(question: Question): Promise<Answer> {
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [{
            role: 'user',
            content: 'Please output a very simple, straightforward, unformatted response to the question: ' + question.question
          }]
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to get answer from Perplexity');
      }

      return { text: data.choices[0].message.content };
    } catch (error) {
      throw new Error('Perplexity API error: ' + error);
    }
  }
}