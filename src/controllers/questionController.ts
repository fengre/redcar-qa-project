import { Question } from '../models/types';
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

  public extractDomain(question: string): string | null {
    const domainRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.(?:[a-zA-Z]{2,})+)/i;
    const match = question.match(domainRegex);
    return match ? match[1] : null;
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