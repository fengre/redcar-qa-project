import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { HistoryService } from './history.service';
import { SaveHistoryDto } from './history.dto';
import { JwtAuthGuard } from '../auth/auth.guard';

@Controller('history')
@UseGuards(JwtAuthGuard)
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  async getHistory() {
    return this.historyService.getHistory();
  }

  @Post()
  async saveHistory(@Body() data: SaveHistoryDto) {
    return this.historyService.saveHistory(data.question, data.domain, data.answer);
  }
} 