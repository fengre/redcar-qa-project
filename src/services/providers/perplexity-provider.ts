import { AIProvider } from '../interfaces/ai-provider.types';
import { Question, Answer } from '../../models/types';

export class PerplexityProvider implements AIProvider {
  private apiKey: string;
  private baseUrl = 'https://api.perplexity.ai/chat/completions';

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('Perplexity API key is not configured');
    }
  }

  async *streamAnswer(question: Question): AsyncGenerator<string, void, unknown> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [{ role: 'user', content: question.question }],
        stream: true,
      })
    });

    if (!response.ok || !response.body) {
      throw new Error(`Stream response error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;
          if (trimmedLine === 'data: [DONE]') return;

          try {
            const data = JSON.parse(trimmedLine.slice(6));
            if (data.choices?.[0]?.delta?.content) {
              yield data.choices[0].delta.content;
            }
          } catch {
            continue;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async getAnswer(question: Question): Promise<Answer> {
    let fullText = '';
    for await (const chunk of this.streamAnswer(question)) {
      fullText += chunk;
    }
    if (!fullText) {
      throw new Error('No response received from Perplexity');
    }
    return { text: fullText };
  }
}