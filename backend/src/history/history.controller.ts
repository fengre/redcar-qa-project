import { Controller, Get, Post, Body } from '@nestjs/common';
import { HistoryService } from './history.service';
import { HistoryItem } from '../common/entities/history.entity';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  async getAllHistory(): Promise<HistoryItem[]> {
    return this.historyService.getAllHistory();
  }

  @Post()
  async saveHistory(@Body() data: { question: string; domain: string; answer: string }): Promise<HistoryItem> {
    return this.historyService.saveHistory(data.question, data.domain, data.answer);
  }
} 