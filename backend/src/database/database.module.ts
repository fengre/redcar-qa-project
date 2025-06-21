import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HistoryItem } from '../interfaces/history.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'sqlite',
        database: 'db.sqlite',
        entities: [HistoryItem],
        synchronize: true, // Only for development
        logging: true,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {} 