import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { CheatsheetsController } from './cheatsheets.controller';
import { CheatsheetsService } from './cheatsheets.service';
import { Cheatsheet } from './cheatsheet.entity';
import { YoutubeVideo } from '../youtube-videos/youtube-video.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cheatsheet, YoutubeVideo]),
    BullModule.registerQueue({
      name: 'cheatsheet-processing',
    }),
  ],
  controllers: [CheatsheetsController],
  providers: [CheatsheetsService],
})
export class CheatsheetsModule {}
