import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistoryItem } from '../interfaces/history.entity';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(HistoryItem)
    private historyRepository: Repository<HistoryItem>,
  ) {}

  async saveHistory(question: string, domain: string, answer: string): Promise<HistoryItem> {
    const historyItem = this.historyRepository.create({
      question,
      domain,
      answer,
    });
    return this.historyRepository.save(historyItem);
  }

  async getAllHistory(): Promise<HistoryItem[]> {
    return this.historyRepository.find({
      order: { timestamp: 'DESC' },
    });
  }
} 