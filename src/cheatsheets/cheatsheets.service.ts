import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Cheatsheet, CheatsheetProcessingStatus } from './cheatsheet.entity';
import { YoutubeVideo } from '../youtube-videos/youtube-video.entity';
import { CreateCheatsheetDto } from './dto/create-cheatsheet.dto';

@Injectable()
export class CheatsheetsService {
  constructor(
    @InjectRepository(Cheatsheet)
    private cheatsheetRepository: Repository<Cheatsheet>,
    @InjectRepository(YoutubeVideo)
    private youtubeVideoRepository: Repository<YoutubeVideo>,
    @InjectQueue('cheatsheet-processing')
    private cheatsheetProcessingQueue: Queue,
  ) {}

  async createCheatsheet(
    createCheatsheetDto: CreateCheatsheetDto,
  ): Promise<Cheatsheet> {
    const { videoId, neededTopics, language } = createCheatsheetDto;

    const video = await this.youtubeVideoRepository.findOne({
      where: { id: videoId },
    });
    if (!video) {
      throw new NotFoundException(`Video with id ${videoId} not found`);
    }

    const newCheatsheet = this.cheatsheetRepository.create({
      video,
      neededTopics,
      language,
      processingStatus: CheatsheetProcessingStatus.PENDING,
    });

    const savedCheatsheet = await this.cheatsheetRepository.save(newCheatsheet);

    await this.cheatsheetProcessingQueue.add('generate-cheatsheet', {
      cheatsheetId: savedCheatsheet.id,
    });

    return savedCheatsheet;
  }
}
