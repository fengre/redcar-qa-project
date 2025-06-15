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
      prompt: "Using all previous information, answer this specific question in a concise, straightforward manner and in plain text with no link references: {question}"
    }
  ];

  constructor(provider: AIProvider) {
    this.provider = provider;
  }

  private async processStep(step: ProcessStep, context: string, question: string): Promise<string> {
    const prompt = step.prompt.replace('{question}', question);
    const fullPrompt = `${context}\n\n${prompt}`;
    
    console.log(`Processing Step: ${step.prompt}`);
    console.log(`Context: ${context}`);
    
    const response = await this.provider.getAnswer({ question: fullPrompt, domain: '' });
    return response.text;
  }

  private cleanFinalOutput(text: string): string {
    return text.replace(/\[x\]/g, '').trim();
  }

  public async process(question: string, domain: string): Promise<string> {
    let context = `Analyzing ${domain}:\n`;
    console.log(`Initial Context: ${context}`);

    const results: string[] = [];
    
    for (const step of this.steps) {
      const stepResult = await this.processStepWithRetry(step, context, question);
      results.push(stepResult);
      context += `\n${stepResult}`;
      console.log(`Updated Context: ${context}`);
    }

    const finalAnswer = results[results.length - 1]
    const cleanedAnswer = this.cleanFinalOutput(finalAnswer);

    console.log(`Final Combined Answer: ${finalAnswer}`);
    console.log(`Cleaned Answer: ${cleanedAnswer}`);

    return cleanedAnswer;
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
}