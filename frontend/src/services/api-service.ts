import { HistoryItem } from '../models/types';

const API_BASE_URL = 'http://localhost:3001';

export class ApiService {
  private static instance: ApiService;

  private constructor() {}

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  async analyzeQuestion(question: string): Promise<ReadableStream<Uint8Array>> {
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

  async getHistory(): Promise<HistoryItem[]> {
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

  async saveHistory(question: string, domain: string, answer: string): Promise<HistoryItem> {
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
} 