import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistoryItem } from './history.entity';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(HistoryItem)
    private historyRepository: Repository<HistoryItem>,
  ) {}

  async getHistory(userId: string): Promise<HistoryItem[]> {
    return this.historyRepository.find({
      where: { userId },
      order: { timestamp: 'DESC' },
    });
  }

  async saveHistory(question: string, domain: string, answer: string, userId: string): Promise<HistoryItem> {
    const historyItem = this.historyRepository.create({
      question,
      domain,
      answer,
      userId,
    });
    return this.historyRepository.save(historyItem);
  }
} 