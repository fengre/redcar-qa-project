import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PerplexityProvider } from './perplexity.provider';
import { MultiStepProcessor } from './multi-step.processor';

@Module({
  imports: [ConfigModule],
  providers: [
    PerplexityProvider,
    {
      provide: 'IAiProvider',
      useClass: PerplexityProvider,
    },
    MultiStepProcessor,
  ],
  exports: [MultiStepProcessor],
})
export class AiModule {} 