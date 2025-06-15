import { AIProvider } from '../services/interfaces/AIProvider';
import { AiService } from '../services/aiService';

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

  public getProvider(): AIProvider {
    return this.aiService.getProvider();
  }

  public extractDomain(question: string): string | null {
    const domainMatch = question.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/i);
    return domainMatch ? domainMatch[1].toLowerCase() : null;
  }

  public validateDomain(domain: string): boolean {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
  }
}