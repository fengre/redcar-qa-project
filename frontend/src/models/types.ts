export interface Question {
  question: string;
  domain: string;
}

export interface Answer {
  text: string;
}

export interface HistoryItem {
  id: string;
  timestamp: Date;
  question: Question;
  answer: Answer;
}