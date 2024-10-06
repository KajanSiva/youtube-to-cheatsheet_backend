import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

@Processor('cheatsheet-processing')
export class CheatsheetProcessingConsumer {
  private readonly logger = new Logger(CheatsheetProcessingConsumer.name);

  @Process('generate-cheatsheet')
  async handleGenerateCheatsheet(job: Job<{ cheatsheetId: string }>) {
    this.logger.debug('Start generating cheatsheet');
    this.logger.debug(job.data);

    // TODO: Implement cheatsheet generation logic

    this.logger.debug('Finished generating cheatsheet');
  }
}
