import { Processor, Process } from '@nestjs/bull';
import { Logger, Injectable } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cheatsheet, CheatsheetProcessingStatus } from './cheatsheet.entity';
import { YoutubeVideo } from '../youtube-videos/youtube-video.entity';
import { StorageService } from '../common/storage/storage.interface';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { loadSummarizationChain } from 'langchain/chains';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from 'langchain/document';
import { z } from 'zod';

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
    const sectionDescriptions = `
- summary: Brief overview capturing the essence of the entire video content.
- key_points: Consolidated list of main topics or concepts discussed.
- detailed_notes: Comprehensive and structured summary of the video content, including key arguments, examples, and explanations.
- important_quotes: List of the most notable quotes or standout statements.
- actions_takeaways: Compiled list of practical tips, steps, or lessons viewers can apply.
- glossary: Definitions of important specialized terms or concepts introduced.
- references_and_resources: Any external resources or citations mentioned.
  `;

    const mapPrompt = PromptTemplate.fromTemplate(`
Analyze the following part of a video transcript and create a partial summary. Focus on the content of this specific part.
Generate the summary in ${language}.

# Focus Themes:
${focusedThemes.length > 0 ? focusedThemes.join(', ') : 'All themes'}

# Summary Sections:
${sectionDescriptions}

# Transcript Part:
{text}

Provide a concise summary focusing on the specified themes and sections:
  `);

    const combinePrompt = PromptTemplate.fromTemplate(`
Create a comprehensive cheatsheet for the entire video content by synthesizing the following partial summaries. 
Organize the information logically and eliminate redundancies.
Generate the cheatsheet in ${language}.

# Focus Themes:
${focusedThemes.length > 0 ? focusedThemes.join(', ') : 'All themes'}

# Summary Sections:
${sectionDescriptions}

{text}

Generate a final cheatsheet with these sections, ensuring each section adheres to its description:
- summary
- key_points
- detailed_notes
- important_quotes
- actions_takeaways
- glossary
- references_and_resources

Ensure the final cheatsheet is well-organized, covers the entire video content, and focuses on the specified themes:
  `);

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
