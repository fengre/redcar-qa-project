import { Question, Answer } from '../../models/types';

export interface IAiProvider {
  getAnswer(question: Question): Promise<Answer>;
  streamAnswer(question: Question): AsyncGenerator<string, void, unknown>;
}