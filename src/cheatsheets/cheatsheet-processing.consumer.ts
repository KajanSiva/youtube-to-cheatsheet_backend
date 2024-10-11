import { Processor, Process } from '@nestjs/bull';
import { Logger, Injectable } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cheatsheet, CheatsheetProcessingStatus } from './cheatsheet.entity';
import { YoutubeVideo } from '../youtube-videos/youtube-video.entity';
import { StorageService } from '../common/storage/storage.interface';
import { ChatOpenAI } from '@langchain/openai';
import { loadSummarizationChain } from 'langchain/chains';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from 'langchain/document';
import {
  createMapPrompt,
  createCombinePrompt,
} from './prompts/cheatsheet-prompts';

@Injectable()
@Processor('cheatsheet-processing')
export class CheatsheetProcessingConsumer {
  private readonly logger = new Logger(CheatsheetProcessingConsumer.name);

  constructor(
    @InjectRepository(Cheatsheet)
    private cheatsheetRepository: Repository<Cheatsheet>,
    @InjectRepository(YoutubeVideo)
    private youtubeVideoRepository: Repository<YoutubeVideo>,
    private storageService: StorageService,
  ) {}

  @Process('generate-cheatsheet')
  async handleGenerateCheatsheet(job: Job<{ cheatsheetId: string }>) {
    this.logger.debug('Start generating cheatsheet');
    this.logger.debug(job.data);

    try {
      const cheatsheet = await this.getCheatsheet(job.data.cheatsheetId);
      const video = await this.getVideo(cheatsheet.video.id);

      const docs = await this.processTranscript(video.transcriptUrl);
      const { result } = await this.generateSummary(
        docs,
        cheatsheet.language,
        cheatsheet.neededTopics,
      );

      cheatsheet.content = { text: result };
      cheatsheet.processingStatus = CheatsheetProcessingStatus.DONE;
      await this.cheatsheetRepository.save(cheatsheet);

      this.logger.debug('Finished generating cheatsheet');
    } catch (error) {
      this.logger.error(`Error generating cheatsheet: ${error.message}`);
      await this.updateCheatsheetStatus(
        job.data.cheatsheetId,
        CheatsheetProcessingStatus.FAILED,
        error.message,
      );
    }
  }

  private async getCheatsheet(cheatsheetId: string): Promise<Cheatsheet> {
    const cheatsheet = await this.cheatsheetRepository.findOne({
      where: { id: cheatsheetId },
      relations: ['video'],
    });
    if (!cheatsheet) {
      throw new Error(`Cheatsheet with id ${cheatsheetId} not found`);
    }
    return cheatsheet;
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

  private async processTranscript(transcriptUrl: string): Promise<Document[]> {
    this.logger.debug('Starting transcript processing...');

    const transcriptContent = await this.storageService.readFile(transcriptUrl);
    const transcriptJson = JSON.parse(transcriptContent.toString('utf-8'));
    const transcript = transcriptJson.text;

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 10000,
      chunkOverlap: 200,
    });

    const docs = await textSplitter.splitDocuments([
      new Document({ pageContent: transcript }),
    ]);

    this.logger.debug(`Transcript split into ${docs.length} chunks.`);
    return docs;
  }

  private async generateSummary(
    docs: Document[],
    language: string,
    focusedThemes: string[],
  ): Promise<{ result: string }> {
    this.logger.debug('Starting summary generation...');

    const model = this.initializeOpenAIModel();
    const chain = this.createSummarizationChain(model, language, focusedThemes);

    this.logger.debug('Generating summary...');
    const result = await chain.invoke({ input_documents: docs });

    this.logger.debug('Summary generation completed successfully.');
    return { result: result.text };
  }

  private initializeOpenAIModel(): ChatOpenAI {
    return new ChatOpenAI({
      temperature: 0.3,
      modelName: 'gpt-4o-mini-2024-07-18',
      maxTokens: 4000,
    });
  }

  private createSummarizationChain(
    model: ChatOpenAI,
    language: string,
    focusedThemes: string[],
  ) {
    const mapPrompt = createMapPrompt(language, focusedThemes);
    const combinePrompt = createCombinePrompt(language, focusedThemes);

    return loadSummarizationChain(model, {
      type: 'map_reduce',
      mapPrompt: mapPrompt,
      combinePrompt: combinePrompt,
    } as any);
  }

  private async updateCheatsheetStatus(
    cheatsheetId: string,
    status: CheatsheetProcessingStatus,
    error?: string,
  ): Promise<void> {
    await this.cheatsheetRepository.update(cheatsheetId, {
      processingStatus: status,
      error: error,
    });
  }
}
