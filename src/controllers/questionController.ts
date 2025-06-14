import { Question } from '../models/types';
import { AiService, AIProviderType } from '../services/aiService';
import { AIProvider } from '../services/interfaces/AIProvider';

export class QuestionController {
  private static instance: QuestionController;
  private aiService: AiService;

  private constructor() {
    this.aiService = AiService.getInstance();
  }

  public static getInstance(): QuestionController {
    if (!QuestionController.instance) {
      QuestionController.instance = new QuestionController();
    }
    return QuestionController.instance;
  }
  
  // Fix: Return AIProvider instance instead of string
  public getProvider(): AIProvider {
    return this.aiService.getProvider();
  }

  public extractDomain(question: string): string | null {
    const domainRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.(?:[a-zA-Z]{2,})+)/i;
    const match = question.match(domainRegex);
    return match ? match[1].toLowerCase() : null;
  }

  public validateDomain(domain: string): boolean {
    // Check for valid TLD (Top Level Domain)
    const validTLDs = /\.(com|org|net|edu|gov|io|ai|app|dev|tech|co)$/i;
    if (!validTLDs.test(domain)) {
      return false;
    }

    // Check for minimum length and valid characters
    const validDomainFormat = /^[a-z0-9-]+\.[a-z0-9-.]+$/i;
    if (!validDomainFormat.test(domain) || domain.length < 4) {
      return false;
    }

    return true;
  }

  public validateQuestion(question: string): { isValid: boolean; error?: string } {
    if (!question.trim()) {
      return { isValid: false, error: 'Question cannot be empty' };
    }

    const domain = this.extractDomain(question);
    if (!domain) {
      return { 
        isValid: false, 
        error: 'Please include a company domain in your question (e.g., "What does example.com do?")' 
      };
    }

    if (!this.validateDomain(domain)) {
      return { 
        isValid: false, 
        error: 'Please provide a valid company domain' 
      };
    }

    return { isValid: true };
  }

  public async processQuestion(questionText: string): Promise<string> {
    const domain = this.extractDomain(questionText);
    if (!domain) {
      throw new Error('No domain found in question');
    }

    const question: Question = {
      question: questionText,
      domain: domain
    };

    const answer = await this.aiService.getAnswer(question);
    return answer.text;
  }
}