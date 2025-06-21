import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionsController } from './questions.controller';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { HistoryItem } from './history.entity';
import { AiModule } from '../ai/ai.module';
import { DomainService } from './domain.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([HistoryItem]),
    AiModule,
  ],
  controllers: [QuestionsController, HistoryController],
  providers: [HistoryService, DomainService],
  exports: [HistoryService],
})
export class ApiModule {} 