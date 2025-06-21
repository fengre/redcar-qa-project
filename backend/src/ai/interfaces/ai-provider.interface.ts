export interface Question {
  question: string;
  domain: string;
}

export interface Answer {
  text: string;
}

export interface IAiProvider {
  getAnswer(question: Question): Promise<Answer>;
  streamAnswer(question: Question): AsyncGenerator<string, void, unknown>;
} 