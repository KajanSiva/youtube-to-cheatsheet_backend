import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { YoutubeVideosController } from './youtube-videos.controller';
import { YoutubeVideosService } from './youtube-videos.service';
import { YoutubeVideo } from './youtube-video.entity';
import { VideoProcessingConsumer } from './video-processing.consumer';

@Module({
  imports: [
    TypeOrmModule.forFeature([YoutubeVideo]),
    BullModule.registerQueue({
      name: 'video-processing',
    }),
  ],
  controllers: [YoutubeVideosController],
  providers: [YoutubeVideosService, VideoProcessingConsumer],
})
export class YoutubeVideosModule {}
