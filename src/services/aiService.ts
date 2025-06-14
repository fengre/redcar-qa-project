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
  private multiStepProcessor: MultiStepProcessor;

  private constructor() {
    try {
      this.providers = new Map([
        [AIProviderType.CLAUDE, new ClaudeProvider()],
        [AIProviderType.PERPLEXITY, new PerplexityProvider()]
      ]);
      
      const defaultProvider = this.providers.get(AIProviderType.PERPLEXITY);
      if (!defaultProvider) {
        throw new Error('Default provider not initialized');
      }
      this.provider = defaultProvider;
      this.multiStepProcessor = new MultiStepAIProcessor(this.provider);
    } catch (error) {
      console.error('Error initializing AiService:', error);
      throw error;
    }
  }

  // Add new method for multi-step processing
  public async *getStreamingAnswer(question: Question): AsyncGenerator<string, void, unknown> {
    if (!question.question.trim()) {
      throw new Error('Question cannot be empty');
    }
    
    yield* this.multiStepProcessor.process(question.question, question.domain);
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

  public getProvider(): AIProvider {
    return this.provider;
  }

  public async getAnswer(question: Question): Promise<Answer> {
    if (!question.question.trim()) {
      throw new Error('Question cannot be empty');
    }
    return this.provider.getAnswer(question);
  }
}