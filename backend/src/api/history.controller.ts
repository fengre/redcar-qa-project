import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { HistoryService } from './history.service';
import { SaveHistoryDto } from './history.dto';
import { JwtAuthGuard } from '../auth/auth.guard';

@Controller('history')
@UseGuards(JwtAuthGuard)
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  async getHistory(@Request() req) {
    const userId = req.user.userId;
    return this.historyService.getHistory(userId);
  }

  @Post()
  async saveHistory(@Body() data: SaveHistoryDto, @Request() req) {
    const userId = req.user.userId;
    return this.historyService.saveHistory(data.question, data.domain, data.answer, userId);
  }
} 