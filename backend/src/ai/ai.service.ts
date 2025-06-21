import { Injectable } from '@nestjs/common';
import { IAiProvider } from './interfaces/ai-provider.interface';
import { PerplexityProvider } from './providers/perplexity.provider';

@Injectable()
export class AiService {
  constructor(private perplexityProvider: PerplexityProvider) {}

  getProvider(): IAiProvider {
    return this.perplexityProvider;
  }
} 