import { AIProvider } from './interfaces/AIProvider';
import { PerplexityProvider } from './providers/PerplexityProvider';

export class AiService {
  private static instance: AiService;
  private provider: AIProvider;

  private constructor() {
    this.provider = new PerplexityProvider();
  }

  public static getInstance(): AiService {
    if (!AiService.instance) {
      AiService.instance = new AiService();
    }
    return AiService.instance;
  }

  public getProvider(): AIProvider {
    return this.provider;
  }
}