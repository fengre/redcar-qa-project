import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QuestionsModule } from './questions/questions.module';
import { HistoryModule } from './history/history.module';
import { AiModule } from './ai/ai.module';
import { DatabaseModule } from './database/database.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    QuestionsModule,
    HistoryModule,
    AiModule,
  ],
  controllers: [AppController],
})
export class AppModule {} 