export interface ProcessStep {
  prompt: string;
}

export interface MultiStepProcessor {
  process(question: string, domain: string): AsyncGenerator<string, void, unknown>;
}