import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class AnalyzeQuestionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  question: string;
} 