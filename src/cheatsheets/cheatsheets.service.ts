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
    const { videoId, comment } = createCheatsheetDto;

    const video = await this.youtubeVideoRepository.findOne({
      where: { id: videoId },
    });
    if (!video) {
      throw new NotFoundException(`Video with id ${videoId} not found`);
    }

    const newCheatsheet = this.cheatsheetRepository.create({
      video,
      comment,
      processingStatus: CheatsheetProcessingStatus.PENDING,
    });

    const savedCheatsheet = await this.cheatsheetRepository.save(newCheatsheet);

    await this.cheatsheetProcessingQueue.add('generate-cheatsheet', {
      cheatsheetId: savedCheatsheet.id,
    });

    return savedCheatsheet;
  }

  async getCheatsheetById(id: string): Promise<Cheatsheet> {
    const cheatsheet = await this.cheatsheetRepository.findOne({
      where: { id },
      relations: ['video'],
    });

    if (!cheatsheet) {
      throw new NotFoundException(`Cheatsheet with id ${id} not found`);
    }

    return cheatsheet;
  }

  async getCheatsheets(videoId?: string): Promise<Cheatsheet[]> {
    const queryBuilder = this.cheatsheetRepository
      .createQueryBuilder('cheatsheet')
      .leftJoinAndSelect('cheatsheet.video', 'video')
      .orderBy('cheatsheet.createdAt', 'DESC');

    if (videoId) {
      queryBuilder.where('video.id = :videoId', { videoId });
    }

    return queryBuilder.getMany();
  }
}
