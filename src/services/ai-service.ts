import { IAiProvider } from './interfaces/ai-provider.types';
import { PerplexityProvider } from './providers/perplexity-provider';

export class AiService {
  private static instance: AiService;
  private provider: IAiProvider;

  private constructor() {
    this.provider = new PerplexityProvider();
  }

  public static getInstance(): AiService {
    if (!AiService.instance) {
      AiService.instance = new AiService();
    }
    return AiService.instance;
  }

  public getProvider(): IAiProvider {
    return this.provider;
  }
}