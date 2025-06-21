import { Controller, Get, Post, Body } from '@nestjs/common';
import { HistoryService } from './history.service';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  async getHistory() {
    return this.historyService.getHistory();
  }

  @Post()
  async saveHistory(@Body() data: { question: string; domain: string; answer: string }) {
    return this.historyService.saveHistory(data.question, data.domain, data.answer);
  }
} 