export interface IProcessStep {
  prompt: string;
}

export interface IMultiStepProcessor {
  process(question: string, domain: string): AsyncGenerator<string, void, unknown>;
}