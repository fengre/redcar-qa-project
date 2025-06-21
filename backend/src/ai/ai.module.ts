import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai.service';
import { PerplexityProvider } from './perplexity.provider';
import { MultiStepProcessor } from './multi-step.processor';

@Module({
  imports: [ConfigModule],
  providers: [
    AiService,
    PerplexityProvider,
    {
      provide: 'IAiProvider',
      useClass: PerplexityProvider,
    },
    MultiStepProcessor,
  ],
  exports: [AiService, MultiStepProcessor],
})
export class AiModule {} 