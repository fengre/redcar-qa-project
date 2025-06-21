import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionsController } from './questions.controller';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { HistoryItem } from './history.entity';
import { AiModule } from '../ai/ai.module';
import { CoreModule } from '../core.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([HistoryItem]),
    AiModule,
    CoreModule,
  ],
  controllers: [QuestionsController, HistoryController],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class ApiModule {} 