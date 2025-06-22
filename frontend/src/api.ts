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
  // Match domains with subdomains, e.g., blog.github.com
  const domainMatch = question.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  return domainMatch ? domainMatch[1].toLowerCase() : null;
}

export function validateDomain(domain: string): boolean {
  const validTLDs = ['com', 'org', 'net', 'edu', 'gov', 'io', 'ai', 'co'];
  // Must not have consecutive hyphens
  if (/--/.test(domain)) return false;
  // Must not start or end with hyphen (on any label)
  if (/(^|-)[-]|[-]($|\.)/.test(domain)) return false;
  // Must not have invalid characters
  if (!/^[a-zA-Z0-9.-]+$/.test(domain)) return false;
  // Must match the general domain pattern
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*(\.[a-zA-Z0-9][a-zA-Z0-9-]*)*\.[a-zA-Z]{2,}$/;
  if (!domainRegex.test(domain)) return false;
  // Second-level domain (before first dot) must be at least 2 characters
  const parts = domain.split('.');
  if (parts[0].length < 2) return false;
  // TLD must be valid
  const extension = parts[parts.length - 1].toLowerCase();
  return validTLDs.includes(extension);
}

// API methods
const API_BASE_URL = 'http://localhost:3001';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('jwt');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function analyzeQuestion(question: string): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch(`${API_BASE_URL}/questions/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    } as Record<string, string>,
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to analyze question');
  }

  return response.body!;
}

export async function getHistory(): Promise<HistoryItem[]> {
  const response = await fetch(`${API_BASE_URL}/history`, {
    headers: {
      ...authHeaders(),
    } as Record<string, string>,
  });
  
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
      ...authHeaders(),
    } as Record<string, string>,
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