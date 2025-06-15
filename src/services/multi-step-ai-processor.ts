import { AIProvider } from './interfaces/ai-provider.types';
import { MultiStepProcessor, ProcessStep } from './interfaces/IMultiStepProcessor';

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
      prompt: "Using all previous information, answer this specific question in a very short, simple, and concise manner, while also removing link references: {question}"
    }
  ];

  constructor(provider: AIProvider) {
    this.provider = provider;
  }

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