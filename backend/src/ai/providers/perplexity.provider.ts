import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAiProvider, Question, Answer } from '../interfaces/ai-provider.interface';

@Injectable()
export class PerplexityProvider implements IAiProvider {
  private readonly logger = new Logger(PerplexityProvider.name);
  private apiKey: string;
  private baseUrl = 'https://api.perplexity.ai/chat/completions';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('PERPLEXITY_API_KEY');
    this.logger.log(`API Key configured: ${this.apiKey ? 'Yes' : 'No'}`);
    if (!this.apiKey || this.apiKey === 'your_perplexity_api_key_here') {
      this.logger.warn('Perplexity API key not configured - using mock responses');
    }
  }

  async *streamAnswer(question: Question): AsyncGenerator<string, void, unknown> {
    this.logger.log(`Making request to Perplexity API for question: ${question.question.substring(0, 50)}...`);
    
    // If API key is not configured, return a mock response
    if (!this.apiKey || this.apiKey === 'your_perplexity_api_key_here') {
      const mockResponse = `This is a mock response for testing. You asked: "${question.question}". Please configure your Perplexity API key in backend/.env to get real responses.`;
      for (const char of mockResponse) {
        yield char;
        await new Promise(resolve => setTimeout(resolve, 50)); // Simulate streaming
      }
      return;
    }
    
    const requestBody = {
      model: 'sonar-pro',
      messages: [{ role: 'user', content: question.question }],
      stream: true,
    };

    this.logger.log(`Request body: ${JSON.stringify(requestBody)}`);

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    this.logger.log(`Response status: ${response.status}`);
    this.logger.log(`Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`API Error: ${response.status} - ${errorText}`);
      throw new Error(`Stream response error: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error('No response body received');
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