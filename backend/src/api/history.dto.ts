import { IsString, IsNotEmpty } from 'class-validator';

export class SaveHistoryDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsString()
  @IsNotEmpty()
  domain: string;

  @IsString()
  @IsNotEmpty()
  answer: string;
} 