import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QuestionsModule } from './questions/questions.module';
import { HistoryModule } from './history/history.module';
import { AiModule } from './ai/ai.module';
import { DatabaseModule } from './database/database.module';
import { AppController } from './app.controller';
import { CoreModule } from './core.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    CoreModule,
    QuestionsModule,
    HistoryModule,
    AiModule,
  ],
  controllers: [AppController],
})
export class AppModule {} 