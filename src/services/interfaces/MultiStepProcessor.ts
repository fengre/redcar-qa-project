export interface StepResult {
  text: string;
  confidence: number;
}

export interface ProcessStep {
  prompt: string;
  weight: number;
}

export interface MultiStepProcessor {
  process(question: string, domain: string): AsyncGenerator<string, void, unknown>;
}