import { Module } from '@nestjs/common';
import { QuestionsController } from './questions.controller';
import { AiModule } from '../ai/ai.module';
import { CoreModule } from '../core.module';

@Module({
  imports: [AiModule, CoreModule],
  controllers: [QuestionsController],
})
export class QuestionsModule {} 