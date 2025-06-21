import { Injectable } from '@nestjs/common';
import { IAiProvider, Question } from './interfaces/ai-provider.interface';

export interface ProcessStep {
  prompt: string;
}

export interface IMultiStepProcessor {
  process(question: string, domain: string): AsyncGenerator<string, void, unknown>;
}

@Injectable()
export class MultiStepProcessor implements IMultiStepProcessor {
  private steps: ProcessStep[] = [
    {
      prompt: "First, analyze the company based on the domain. What industry are they in?"
    },
    {
      prompt: "Based on the previous analysis, what are their main products or services?"
    },
    {
      prompt: "Using all previous information, answer this specific question in a very short, simple, and concise manner, while also removing link references: {question}"
    }
  ];

  constructor(private provider: IAiProvider) {}

  public async *process(question: string, domain: string): AsyncGenerator<string, void, unknown> {
    let context = `Analyzing ${domain}:\n`;
    
    for (const step of this.steps.slice(0, -1)) {
      const prompt = step.prompt.replace('{question}', question);
      const response = await this.provider.getAnswer({ 
        question: `${context}\n\n${prompt}`,
        domain: ''
      });
      context += `\n${response.text}`;
    }

    const finalPrompt = this.steps[this.steps.length - 1].prompt.replace('{question}', question);
    for await (const chunk of this.provider.streamAnswer({ 
      question: `${context}\n\n${finalPrompt}`,
      domain
    })) {
      yield chunk;
    }
  }
} 