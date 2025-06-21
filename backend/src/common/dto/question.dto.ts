import { IsString, IsNotEmpty } from 'class-validator';

export class QuestionDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsString()
  @IsNotEmpty()
  domain: string;
}

export class AnalyzeQuestionDto {
  @IsString()
  @IsNotEmpty()
  question: string;
} 