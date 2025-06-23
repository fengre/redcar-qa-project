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
  const validTLDs = [
      // Generic TLDs
      'com', 'org', 'net', 'info', 'biz', 'gov', 'edu', 'mil', 'int',
      // Country-code TLDs (selection)
      'us', 'uk', 'ca', 'de', 'fr', 'au', 'jp', 'cn', 'in', 'br', 'ru', 'za', 'nl', 'se', 'no', 'es', 'it', 'ch', 'be', 'dk', 'fi', 'pl', 'tr', 'mx', 'kr', 'ar', 'at', 'cz', 'gr', 'hu', 'ie', 'il', 'nz', 'pt', 'ro', 'sg', 'sk', 'th', 'ua', 'vn',
      // Popular new gTLDs
      'io', 'ai', 'co', 'app', 'dev', 'online', 'site', 'tech', 'store', 'blog', 'me', 'cloud', 'space', 'website', 'live', 'fun', 'world', 'today', 'news', 'agency', 'solutions', 'digital', 'company', 'group', 'life', 'center', 'media', 'systems', 'network', 'services', 'academy', 'support', 'email', 'finance', 'consulting', 'design', 'events', 'institute', 'marketing', 'software', 'tools', 'ventures', 'works', 'zone', 'shop', 'team', 'capital', 'city', 'club', 'express', 'global', 'health', 'host', 'law', 'partners', 'press', 'school', 'social', 'studio', 'tips', 'university', 'vip', 'wiki', 'gallery', 'graphics', 'photo', 'photos', 'pictures', 'video', 'audio', 'film', 'tv', 'radio', 'music', 'games', 'game', 'play', 'run', 'coach', 'fitness', 'care', 'clinic', 'dental', 'doctor', 'healthcare', 'hospital', 'surgery', 'vision', 'fashion', 'jewelry', 'shoes', 'toys', 'travel', 'vacations', 'flights', 'cruise', 'holiday', 'hotel', 'apartments', 'rentals', 'restaurant', 'cafe', 'bar', 'pub', 'pizza', 'wine', 'beer', 'coffee', 'kitchen', 'recipes', 'menu', 'food', 'organic', 'farm', 'garden', 'flowers', 'green', 'energy', 'solar', 'eco', 'earth', 'water', 'science', 'technology', 'engineering', 'education', 'courses', 'study', 'degree', 'mba', 'phd', 'lawyer', 'legal', 'attorney', 'accountant', 'bank', 'insurance', 'mortgage', 'loans', 'credit', 'fund', 'investments', 'exchange', 'market', 'trade', 'money', 'pay', 'cash', 'gold', 'silver', 'diamond', 'luxury', 'estate', 'property', 'realty', 'homes', 'house', 'apartments', 'rentals', 'lease', 'construction', 'builders', 'contractors', 'repair', 'cleaning', 'plumbing', 'electric', 'security', 'safety', 'fire', 'alarm', 'guard', 'protection', 'defense', 'army', 'navy', 'airforce', 'police', 'gov', 'mil', 'int'
    ];
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
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

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
  const headers = authHeaders();
  
  const response = await fetch(`${API_BASE_URL}/history`, {
    headers: headers as Record<string, string>,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch history: ${response.status} ${errorText}`);
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