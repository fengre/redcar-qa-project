export interface IAiProvider {
  analyze(question: string, domain: string): Promise<string>;
  streamAnalyze(question: string, domain: string): AsyncGenerator<string>;
} 