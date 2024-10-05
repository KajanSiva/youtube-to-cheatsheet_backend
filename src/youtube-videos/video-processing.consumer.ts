import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

@Processor('video-processing')
export class VideoProcessingConsumer {
  private readonly logger = new Logger(VideoProcessingConsumer.name);

  @Process('process-video')
  async handleProcessVideo(job: Job<{ videoId: string }>) {
    this.logger.debug('Start processing video');
    this.logger.debug(job.data);
    // TODO: Implement video processing logic here
    this.logger.debug('Finished processing video');
  }
}
