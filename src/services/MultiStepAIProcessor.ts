import { AIProvider } from './interfaces/AIProvider';
import { MultiStepProcessor, ProcessStep } from './interfaces/MultiStepProcessor';

export class MultiStepAIProcessor implements MultiStepProcessor {
  private provider: AIProvider;
  private steps: ProcessStep[] = [
    {
      prompt: "First, analyze the company based on the domain. What industry are they in?"
    },
    {
      prompt: "Based on the previous analysis, what are their main products or services?"
    },
    {
      prompt: "Using all previous information, answer this specific question in a simple, short, and concise manner, removing link references: {question}"
    }
  ];

  constructor(provider: AIProvider) {
    this.provider = provider;
  }

  public async *process(question: string, domain: string): AsyncGenerator<string, void, unknown> {
    let context = `Analyzing ${domain}:\n`;
    const results: string[] = [];
    
    // First, process the preliminary steps
    for (const step of this.steps.slice(0, -1)) {
      const stepResult = await this.processStepWithRetry(step, context, question);
      results.push(stepResult);
      context += `\n${stepResult}`;
    }

    // For the final step, stream the response directly
    const finalStep = this.steps[this.steps.length - 1];
    const finalPrompt = finalStep.prompt.replace('{question}', question);
    const fullPrompt = `${context}\n\n${finalPrompt}`;

    // Stream each character from the provider
    for await (const chunk of this.provider.streamAnswer({ 
      question: fullPrompt,
      domain 
    })) {
      yield chunk;
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  private async processStepWithRetry(step: ProcessStep, context: string, question: string): Promise<string> {
    const maxRetries = 2;
    let attempts = 0;
    let lastError: Error | null = null;
    
    while (attempts < maxRetries) {
      try {
        return await this.processStep(step, context, question);
      } catch (error) {
        lastError = error as Error;
        attempts++;
      }
    }
    
    throw lastError || new Error('Failed to process step after multiple attempts');
  }

  private async processStep(step: ProcessStep, context: string, question: string): Promise<string> {
    const prompt = step.prompt.replace('{question}', question);
    const fullPrompt = `${context}\n\n${prompt}`;
    const response = await this.provider.getAnswer({ question: fullPrompt, domain: '' });
    return response.text;
  }
}