import { Injectable } from '@nestjs/common';
import { IAiProvider } from './ai-provider.interface';
import { PerplexityProvider } from './perplexity.provider';

@Injectable()
export class AiService {
  constructor(private perplexityProvider: PerplexityProvider) {}

  getProvider(): IAiProvider {
    return this.perplexityProvider;
  }
} 