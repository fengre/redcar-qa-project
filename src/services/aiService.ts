import { Question, Answer } from '../models/types';
import { AIProvider } from './interfaces/AIProvider';
import { ClaudeProvider } from './providers/ClaudeProvider';
import { PerplexityProvider } from './providers/PerplexityProvider';

export enum AIProviderType {
  CLAUDE = 'claude',
  PERPLEXITY = 'perplexity'
}

export class AiService {
  private static instance: AiService;
  private provider: AIProvider;
  private providers: Map<AIProviderType, AIProvider>;

  private constructor() {
    this.providers = new Map([
      [AIProviderType.CLAUDE, new ClaudeProvider()],
      [AIProviderType.PERPLEXITY, new PerplexityProvider()]
    ]);
    
    // Default to Claude
    this.provider = this.providers.get(AIProviderType.PERPLEXITY)!;
  }

  public static getInstance(): AiService {
    if (!AiService.instance) {
      AiService.instance = new AiService();
    }
    return AiService.instance;
  }

  public setProvider(providerType: AIProviderType): void {
    const newProvider = this.providers.get(providerType);
    if (!newProvider) {
      throw new Error(`Provider ${providerType} not found`);
    }
    this.provider = newProvider;
  }

  public async getAnswer(question: Question): Promise<Answer> {
    return this.provider.getAnswer(question);
  }
}