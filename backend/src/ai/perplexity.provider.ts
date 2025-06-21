import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAiProvider } from './ai-provider.interface';

@Injectable()
export class PerplexityProvider implements IAiProvider {
  private readonly logger = new Logger(PerplexityProvider.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.perplexity.ai/chat/completions';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('PERPLEXITY_API_KEY');
    if (!this.apiKey) {
      this.logger.warn('Perplexity API Key not configured');
    } else {
      this.logger.log('API Key configured: Yes');
    }
  }

  async analyze(question: string, domain: string): Promise<string> {
    const response = await this.makeRequest(question, domain);
    return response.choices[0]?.message?.content || 'No response received';
  }

  async *streamAnalyze(question: string, domain: string): AsyncGenerator<string> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that analyzes companies based on questions. 
            When asked about a company, provide detailed, accurate information based on current data.
            Always be professional and factual in your responses.`
          },
          {
            role: 'user',
            content: `Question: ${question}\nCompany Domain: ${domain}`
          }
        ],
        stream: true,
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private async makeRequest(question: string, domain: string) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that analyzes companies based on questions. 
            When asked about a company, provide detailed, accurate information based on current data.
            Always be professional and factual in your responses.`
          },
          {
            role: 'user',
            content: `Question: ${question}\nCompany Domain: ${domain}`
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
} 