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
      prompt: "If the previous response is not false, using all previous information, answer this specific question in a very short, simple, and concise manner: {question}. Otherwise, explain in a simple, concise manner that the company or website does not seem to exist or is not a legitimate company or website."
    }
  ];

  constructor(@Inject('IAiProvider') private provider: IAiProvider) {}

  /**
   * Cleans text formatting including various AI-generated formatting patterns
   * @param text The text to clean
   * @returns The cleaned text with formatting removed
   */
  private cleanTextFormatting(text: string): string {
    let cleaned = text;
    
    // Remove link references in the format [x] where x is an integer
    cleaned = cleaned.replace(/\[\d+\]/g, '');
    
    // Remove bold formatting (**text**)
    cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1');
    
    // Remove italic formatting (*text* or _text_)
    cleaned = cleaned.replace(/\*(.*?)\*/g, '$1');
    cleaned = cleaned.replace(/_(.*?)_/g, '$1');
    
    // Remove markdown headers (# Header)
    cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
    
    // Remove blockquotes (> text)
    cleaned = cleaned.replace(/^>\s+/gm, '');
    
    // Remove inline code formatting (`code`)
    cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
    
    // Remove HTML-like tags
    cleaned = cleaned.replace(/<(b|i|strong|em)>(.*?)<\/\1>/gi, '$2');
    
    // Remove parenthetical references (1) (2) (3)
    cleaned = cleaned.replace(/\(\d+\)/g, '');
    
    // Remove footnote patterns
    cleaned = cleaned.replace(/Footnote\s+\d+:\s*/gi, '');
    cleaned = cleaned.replace(/Source:\s*/gi, '');
    cleaned = cleaned.replace(/Reference:\s*/gi, '');
    cleaned = cleaned.replace(/According to:\s*/gi, '');
    
    // Normalize quotes and dashes
    cleaned = cleaned.replace(/[""]/g, '"'); // smart quotes to regular quotes
    cleaned = cleaned.replace(/['']/g, "'"); // smart apostrophes to regular
    cleaned = cleaned.replace(/—/g, '-'); // em dash to regular dash
    
    // Clean up extra whitespace (but preserve list formatting)
    cleaned = cleaned.replace(/[ ]{2,}/g, ' '); // multiple spaces to single space (but preserve single spaces)
    cleaned = cleaned.replace(/\s+\./g, '.'); // space before period
    cleaned = cleaned.replace(/\s+,/g, ','); // space before comma
    
    return cleaned;
  }

  public async *process(question: string, domain: string): AsyncGenerator<string, void, unknown> {
    let context = `Analyzing ${domain}:\n`;
    
    for (const step of this.steps.slice(0, -1)) {
      const prompt = step.prompt.replace('{question}', question);
      const response = await this.provider.analyze(`${context}\n\n${prompt}`, '');
      context += `\n${response}`;
    }

    const finalPrompt = this.steps[this.steps.length - 1].prompt.replace('{question}', question);
    for await (const chunk of this.provider.streamAnalyze(`${context}\n\n${finalPrompt}`, domain)) {
      // Clean link references from each chunk before yielding
      yield this.cleanTextFormatting(chunk);
    }
  }
} 