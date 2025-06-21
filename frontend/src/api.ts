// Types
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

// Domain helpers
export function extractDomain(question: string): string | null {
  const domainMatch = question.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/i);
  return domainMatch ? domainMatch[1].toLowerCase() : null;
}

export function validateDomain(domain: string): boolean {
  const validTLDs = ['com', 'org', 'net', 'edu', 'gov', 'io', 'ai', 'co'];
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*(\.[a-zA-Z0-9][a-zA-Z0-9-]*)*\.[a-zA-Z]{2,}$/;
  
  if (!domainRegex.test(domain)) {
    return false;
  }

  const extension = domain.split('.').pop()?.toLowerCase();
  return extension ? validTLDs.includes(extension) : false;
}

// API methods
const API_BASE_URL = 'http://localhost:3001';

export async function analyzeQuestion(question: string): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch(`${API_BASE_URL}/questions/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to analyze question');
  }

  return response.body!;
}

export async function getHistory(): Promise<HistoryItem[]> {
  const response = await fetch(`${API_BASE_URL}/history`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch history');
  }

  const data = await response.json();
  return data.map((item: any) => ({
    id: item.id,
    timestamp: new Date(item.timestamp),
    question: { question: item.question, domain: item.domain },
    answer: { text: item.answer },
  }));
}

export async function saveHistory(question: string, domain: string, answer: string): Promise<HistoryItem> {
  const response = await fetch(`${API_BASE_URL}/history`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question, domain, answer }),
  });

  if (!response.ok) {
    throw new Error('Failed to save history');
  }

  const data = await response.json();
  return {
    id: data.id,
    timestamp: new Date(data.timestamp),
    question: { question: data.question, domain: data.domain },
    answer: { text: data.answer },
  };
} 