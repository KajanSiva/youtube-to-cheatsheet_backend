import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { YoutubeVideo, VideoProcessingStatus } from './youtube-video.entity';

@Injectable()
export class YoutubeVideosService {
  constructor(
    @InjectRepository(YoutubeVideo)
    private youtubeVideoRepository: Repository<YoutubeVideo>,
    @InjectQueue('video-processing') private videoProcessingQueue: Queue,
  ) {}

  async createYoutubeVideo(url: string) {
    const youtubeId = this.extractYoutubeId(url);
    if (!youtubeId) {
      throw new Error('Invalid YouTube URL');
    }

    const newVideo = this.youtubeVideoRepository.create({
      youtubeId,
      processingStatus: VideoProcessingStatus.PENDING,
    });

    const savedVideo = await this.youtubeVideoRepository.save(newVideo);

    await this.videoProcessingQueue.add('process-video', {
      videoId: savedVideo.id,
    });

    return savedVideo;
  }

  async getDiscussionTopics(id: string): Promise<object> {
    const video = await this.youtubeVideoRepository.findOne({ where: { id } });

    if (!video) {
      throw new NotFoundException(`Video with id ${id} not found`);
    }

    if (!video.discussionTopics) {
      throw new NotFoundException(
        `Discussion topics for video with id ${id} are not available yet`,
      );
    }

    return video.discussionTopics;
  }

  private extractYoutubeId(url: string): string | null {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  }

  async getVideos(): Promise<
    {
      id: string;
      youtubeId: string;
      title: string | null;
      processingStatus: VideoProcessingStatus;
      cheatsheetCount: number;
    }[]
  > {
    const videos = await this.youtubeVideoRepository
      .createQueryBuilder('video')
      .leftJoin('video.cheatsheets', 'cheatsheet')
      .select([
        'video.id',
        'video.youtubeId',
        'video.title',
        'video.processingStatus',
      ])
      .addSelect('COUNT(cheatsheet.id)', 'cheatsheetCount')
      .groupBy('video.id')
      .getRawMany();

    return videos.map((video) => ({
      id: video.video_id,
      youtubeId: video.video_youtube_id,
      title: video.video_title,
      processingStatus: video.video_processing_status,
      cheatsheetCount: parseInt(video.cheatsheetCount, 10),
    }));
  }
}
