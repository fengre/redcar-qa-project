import { Controller, Post, Body, Res, HttpStatus, BadRequestException, Logger, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { DomainService } from './domain.service';
import { MultiStepProcessor } from '../ai/multi-step.processor';
import { AnalyzeQuestionDto } from './question.dto';
import { JwtAuthGuard } from '../auth/auth.guard';

@Controller('questions')
export class QuestionsController {
  private readonly logger = new Logger(QuestionsController.name);

  constructor(
    private readonly domainService: DomainService,
    private readonly multiStepProcessor: MultiStepProcessor,
  ) {}

  @Post('analyze')
  @UseGuards(JwtAuthGuard)
  async analyzeQuestion(@Body() analyzeDto: AnalyzeQuestionDto, @Res() res: Response) {
    try {
      this.logger.log(`Received question: ${analyzeDto.question}`);
      
      const domain = this.domainService.extractDomain(analyzeDto.question);
      this.logger.log(`Extracted domain: ${domain}`);
      
      if (!domain) {
        throw new BadRequestException('Please include a company domain in your question');
      }

      if (!this.domainService.validateDomain(domain)) {
        throw new BadRequestException('Invalid domain format');
      }

      // Set headers for streaming response
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Transfer-Encoding', 'chunked');
      res.status(HttpStatus.OK);

      let fullText = '';
      for await (const chunk of this.multiStepProcessor.process(analyzeDto.question, domain)) {
        fullText += chunk;
        res.write(chunk);
      }

      res.end();
    } catch (error) {
      this.logger.error(`Error processing question: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // Return a more specific error message
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to process question',
        error: error.message,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }
} 