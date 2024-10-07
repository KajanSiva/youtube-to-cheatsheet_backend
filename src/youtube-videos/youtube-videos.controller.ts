import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpException,
  Get,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { YoutubeVideosService } from './youtube-videos.service';

@Controller('youtube-videos')
export class YoutubeVideosController {
  constructor(private readonly youtubeVideosService: YoutubeVideosService) {}

  @Post()
  async createYoutubeVideo(@Body('url') url: string) {
    try {
      const result = await this.youtubeVideosService.createYoutubeVideo(url);
      return { message: 'YouTube video added successfully', id: result.id };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':id/discussion-topics')
  async getDiscussionTopics(@Param('id') id: string) {
    try {
      const topics = await this.youtubeVideosService.getDiscussionTopics(id);
      return { discussionTopics: topics };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async getVideos() {
    try {
      const videos = await this.youtubeVideosService.getVideos();
      return videos.map((video) => ({
        id: video.id,
        youtubeId: video.youtubeId,
        title: video.title,
        processingStatus: video.processingStatus,
        thumbnailUrl: video.thumbnailUrl,
        cheatsheetCount: video.cheatsheetCount,
      }));
    } catch (error) {
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
