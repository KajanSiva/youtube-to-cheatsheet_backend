import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpException,
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
}
