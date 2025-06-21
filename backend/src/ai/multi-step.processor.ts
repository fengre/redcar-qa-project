import { Injectable, Inject } from '@nestjs/common';
import { IAiProvider } from './ai-provider.interface';

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
      prompt: "First, analyze the company based on the domain. Is it a legitimate company and website? If not, return 'false'. If it is, return 'true'."
    },
    {
      prompt: "If the previous response is true, give some background knowledge on what industry the company is in and what the main products or services are. If the previous response is false, return 'false'."
    },
    {
      prompt: "If the previous response is not false, using all previous information, answer this specific question in a very short, simple, and concise manner, while also removing link references: {question}. Otherwise, explain in a simple, concise manner that the company or website does not seem to exist or is not a legitimate company or website."
    }
  ];

  constructor(@Inject('IAiProvider') private provider: IAiProvider) {}

  public async *process(question: string, domain: string): AsyncGenerator<string, void, unknown> {
    let context = `Analyzing ${domain}:\n`;
    
    for (const step of this.steps.slice(0, -1)) {
      const prompt = step.prompt.replace('{question}', question);
      const response = await this.provider.analyze(`${context}\n\n${prompt}`, '');
      context += `\n${response}`;
    }

    const finalPrompt = this.steps[this.steps.length - 1].prompt.replace('{question}', question);
    for await (const chunk of this.provider.streamAnalyze(`${context}\n\n${finalPrompt}`, domain)) {
      yield chunk;
    }
  }
} 