import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { PerplexityProvider } from './providers/perplexity.provider';
import { MultiStepProcessor } from './multi-step.processor';

@Module({
  providers: [
    AiService,
    PerplexityProvider,
    {
      provide: MultiStepProcessor,
      useFactory: (provider: PerplexityProvider) => new MultiStepProcessor(provider),
      inject: [PerplexityProvider],
    },
  ],
  exports: [AiService, MultiStepProcessor],
})
export class AiModule {} 