export interface Question {
  question: string;
  domain: string;
}

export interface Answer {
  text: string;
}

export interface PuterResponse {
  message: {
    content: Array<{
      text: string;
    }>;
  };
}