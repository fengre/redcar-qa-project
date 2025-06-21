import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('history_item')
export class HistoryItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  question: string;

  @Column()
  domain: string;

  @Column('text')
  answer: string;

  @CreateDateColumn()
  timestamp: Date;
} 