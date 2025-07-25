import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HistoryItem } from '../api/history.entity';
import { User } from '../auth/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'sqlite',
        database: 'db.sqlite',
        entities: [HistoryItem, User],
        synchronize: true, // Only for development
        logging: true,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {} 