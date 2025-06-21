import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApiModule } from './api/api.module';
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
    ApiModule,
    AiModule,
  ],
  controllers: [AppController],
})
export class AppModule {} 