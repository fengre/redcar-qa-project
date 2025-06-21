import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class HistoryItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  question: string;

  @Column('text')
  domain: string;

  @Column('text')
  answer: string;

  @CreateDateColumn()
  timestamp: Date;
} 