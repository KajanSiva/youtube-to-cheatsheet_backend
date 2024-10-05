import { Processor, Process } from '@nestjs/bull';
import { Logger, Injectable } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { YoutubeVideo, VideoProcessingStatus } from './youtube-video.entity';
import { StorageService } from '../common/storage/storage.interface';
import { youtubeDl } from 'youtube-dl-exec';
import * as path from 'path';

@Injectable()
@Processor('video-processing')
export class VideoProcessingConsumer {
  private readonly logger = new Logger(VideoProcessingConsumer.name);

  constructor(
    @InjectRepository(YoutubeVideo)
    private youtubeVideoRepository: Repository<YoutubeVideo>,
    private storageService: StorageService,
  ) {}

  @Process('process-video')
  async handleProcessVideo(job: Job<{ videoId: string }>) {
    this.logger.debug('Start processing video');
    this.logger.debug(job.data);

    const video = await this.getVideo(job.data.videoId);
    await this.fetchVideoTitle(video);
    await this.fetchAudio(video);
    // await this.generateTranscript(video);
    // await this.fetchTopics(video);

    this.logger.debug('Finished processing video');
  }

  private async getVideo(videoId: string): Promise<YoutubeVideo> {
    const video = await this.youtubeVideoRepository.findOne({
      where: { id: videoId },
    });
    if (!video) {
      throw new Error(`Video with id ${videoId} not found`);
    }
    return video;
  }

  private async fetchVideoTitle(video: YoutubeVideo): Promise<void> {
    try {
      const youtubeUrl = `https://www.youtube.com/watch?v=${video.youtubeId}`;

      // Get video info
      const output = await youtubeDl(youtubeUrl, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
      });

      // TODO: check why output is not typed properly
      const title = (output as { title: string }).title;

      // Update video entity with the title
      video.title = title;
      await this.youtubeVideoRepository.save(video);

      this.logger.debug(`Video title fetched: ${title}`);
    } catch (error) {
      this.logger.error(`Error fetching video title: ${error.message}`);
      throw error;
    }
  }

  private async fetchAudio(video: YoutubeVideo): Promise<void> {
    try {
      const youtubeUrl = `https://www.youtube.com/watch?v=${video.youtubeId}`;
      const audioFileName = `${video.youtubeId}.mp3`;
      const tempOutputPath = path.join('/tmp', audioFileName);

      // Download and process audio
      await youtubeDl(youtubeUrl, {
        output: tempOutputPath,
        extractAudio: true,
        audioFormat: 'mp3',
      });

      // Read the file and save it using StorageService
      const audioBuffer = await this.storageService.readFile(tempOutputPath);
      const audioFilePath = await this.storageService.saveFile(
        audioFileName,
        audioBuffer,
      );

      // Update video entity
      video.audioUrl = audioFilePath;
      video.processingStatus = VideoProcessingStatus.AUDIO_FETCHED;
      await this.youtubeVideoRepository.save(video);

      // Clean up temporary file
      await this.storageService.deleteFile(tempOutputPath);

      this.logger.debug(`Audio fetched and saved: ${audioFilePath}`);
    } catch (error) {
      this.logger.error(`Error fetching audio: ${error.message}`);
      throw error;
    }
  }

  private async generateTranscript(video: YoutubeVideo): Promise<void> {
    // TODO: Implement transcript generation logic
    const transcriptBuffer = Buffer.from('Dummy transcript content');
    const transcriptFileName = `${video.youtubeId}_transcript.txt`;
    const transcriptFilePath = await this.storageService.saveFile(
      transcriptFileName,
      transcriptBuffer,
    );

    video.transcriptUrl = transcriptFilePath;
    video.processingStatus = VideoProcessingStatus.TRANSCRIPT_GENERATED;
    await this.youtubeVideoRepository.save(video);
  }

  private async fetchTopics(video: YoutubeVideo): Promise<void> {
    // TODO: Implement topic fetching logic
    video.discussionTopics = { topics: ['Dummy topic 1', 'Dummy topic 2'] };
    video.processingStatus = VideoProcessingStatus.TOPICS_FETCHED;
    await this.youtubeVideoRepository.save(video);
  }
}
