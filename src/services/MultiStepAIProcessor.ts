import { AIProvider } from './interfaces/AIProvider';
import { MultiStepProcessor, ProcessStep, StepResult } from './interfaces/MultiStepProcessor';
import { Question } from '../models/types';

export class MultiStepAIProcessor implements MultiStepProcessor {
  private provider: AIProvider;
  private steps: ProcessStep[] = [
    {
      prompt: "First, analyze the company based on the domain. What industry are they in?",
      weight: 0.3
    },
    {
      prompt: "Based on the previous analysis, what are their main products or services?",
      weight: 0.3
    },
    {
      prompt: "Using all previous information, answer this specific question: {question}",
      weight: 0.4
    }
  ];

  constructor(provider: AIProvider) {
    this.provider = provider;
  }

  private async* processStep(step: ProcessStep, context: string, question: string): AsyncGenerator<string, StepResult, unknown> {
    const prompt = step.prompt.replace('{question}', question);
    const fullPrompt = `${context}\n\n${prompt}`;
    
    let result = '';
    for await (const chunk of this.provider.streamAnswer({ question: fullPrompt, domain: '' })) {
      result += chunk;
      yield chunk;
    }

    return {
      text: result,
      confidence: this.calculateConfidence(result)
    };
  }

  private calculateConfidence(text: string): number {
    // Simple confidence calculation based on response length and specificity
    const words = text.split(' ').length;
    const hasSpecificTerms = /\b(specifically|precisely|exactly|clearly|definitely)\b/i.test(text);
    const hasNumbers = /\d+/.test(text);
    
    let confidence = Math.min(words / 100, 1); // Length factor
    if (hasSpecificTerms) confidence += 0.2;
    if (hasNumbers) confidence += 0.2;
    
    return Math.min(confidence, 1);
  }

  public async* process(question: string, domain: string): AsyncGenerator<string, void, unknown> {
    let context = `Analyzing ${domain}:\n`;
    yield context;

    const results: StepResult[] = [];
    
    for (const step of this.steps) {
      yield '\n\nProcessing next step...\n';
      
      const stepResult = await this.processStepWithRetry(step, context, question);
      results.push(stepResult);
      
      // Add step result to context for next iteration
      context += `\n${stepResult.text}`;
    }

    // Final weighted combination
    const finalAnswer = this.combineResults(results, question);
    yield '\n\nFinal Answer:\n' + finalAnswer;
  }

  private async processStepWithRetry(step: ProcessStep, context: string, question: string): Promise<StepResult> {
    const maxRetries = 2;
    let attempts = 0;
    
    while (attempts < maxRetries) {
      try {
        let result = '';
        for await (const chunk of this.processStep(step, context, question)) {
          result += chunk;
        }
        
        const confidence = this.calculateConfidence(result);
        if (confidence < 0.5 && attempts < maxRetries - 1) {
          attempts++;
          continue;
        }
        
        return { text: result, confidence };
      } catch (error) {
        if (attempts >= maxRetries - 1) throw error;
        attempts++;
      }
    }
    
    throw new Error('Failed to process step after multiple attempts');
  }

  private combineResults(results: StepResult[], originalQuestion: string): string {
    const combinedContext = results
      .map((result, index) => `${this.steps[index].weight * result.confidence * result.text}`)
      .join('\n');
    
    return `Based on the analysis:\n${combinedContext}\n\nFinal response to "${originalQuestion}":\n${results[results.length - 1].text}`;
  }
}