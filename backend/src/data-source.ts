import { DataSource } from 'typeorm';
import { User } from './auth/user.entity';
import { HistoryItem } from './api/history.entity';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'db.sqlite',
  entities: [User, HistoryItem],
  migrations: ['src/migration/**/*.ts'],
  synchronize: false,
}); 