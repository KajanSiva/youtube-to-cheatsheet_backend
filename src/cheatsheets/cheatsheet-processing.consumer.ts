import { Processor, Process } from '@nestjs/bull';
import { Logger, Injectable } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cheatsheet, CheatsheetProcessingStatus } from './cheatsheet.entity';
import { YoutubeVideo } from '../youtube-videos/youtube-video.entity';
import { StorageService } from '../common/storage/storage.interface';
import { loadSummarizationChain, StuffDocumentsChain } from 'langchain/chains';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from 'langchain/document';
import {
  createRefinePrompt,
  createQuestionPrompt,
  createOneShotPrompt,
} from './prompts/cheatsheet-prompts';
import { ChatAnthropic } from '@langchain/anthropic';

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
      chunkSize: 100000,
      chunkOverlap: 10000,
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

    const chunkCount = docs.length;
    const refinePrompt = createRefinePrompt();
    const questionPrompt = createQuestionPrompt();
    const oneShotPrompt = createOneShotPrompt();

    const model = this.initializeAnthropicModel();

    if (chunkCount > 1) {
      const chain = loadSummarizationChain(model, {
        type: 'refine',
        questionPrompt,
        refinePrompt,
      });

      this.logger.debug('Generating summary...');

      const result = await chain.invoke({ input_documents: docs });

      this.logger.debug('Summary generation completed successfully.');

      return { result: result.output_text };
    }

    const chain = oneShotPrompt.pipe(model);

    this.logger.debug('Generating summary...');

    const result = await chain.invoke({ text: docs[0].pageContent });

    this.logger.debug('Summary generation completed successfully.');

    return { result: result.content.toString() };
  }

  private initializeAnthropicModel(): ChatAnthropic {
    return new ChatAnthropic({
      temperature: 0.6,
      modelName: 'claude-3-5-sonnet-20240620',
      maxTokens: 4000, // TODO: iterate on this
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    });
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
