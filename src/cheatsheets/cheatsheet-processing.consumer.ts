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
      const { structuredOutput } = await this.generateSummary(
        docs,
        cheatsheet.language,
        cheatsheet.neededTopics,
      );

      cheatsheet.content = structuredOutput;
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
  ): Promise<{ structuredOutput: any }> {
    this.logger.debug('Starting summary generation...');

    const model = this.initializeOpenAIModel();
    const chain = this.createSummarizationChain(model, language, focusedThemes);

    this.logger.debug('Generating summary...');
    const result = await chain.invoke({ input_documents: docs });

    const structuredOutput = await this.generateStructuredOutput(
      model,
      result.text,
      language,
    );

    this.logger.debug('Summary generation completed successfully.');
    return { structuredOutput };
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
    const mapPrompt = PromptTemplate.fromTemplate(`
You are tasked with creating a detailed cheatsheet from a section of a YouTube video transcript in ${language}. Focus on extracting the most valuable information in a concise, easy-to-reference format. Your output should include:

1. Main Topic: Identify the primary subject of this section.
2. Key Points: List 3-5 crucial pieces of information, using bullet points.
3. Definitions: Note any important terms or concepts explained, with brief definitions.
4. Resources: List any books, websites, or tools mentioned.

Format your response using markdown for clarity and structure. Use bullet points for lists, bold for main topics, and italics for emphasis on key terms.

Remember, the goal is to create content that will be easily understood and quickly referenced by someone who hasn't watched the video. Ensure all content is in ${language}.

Do that on the following text:
{text}
  `);

    const combinePrompt = PromptTemplate.fromTemplate(`
Your task is to create a comprehensive cheatsheet by combining and organizing the information from multiple sections of a YouTube video in ${language}. Follow these steps:

1. Summary: Begin with a brief (2-3 sentences) overview of the entire video's main topics.

2. Key Points: Compile and organize all the key points from each section. Group related points together under relevant subheadings. Eliminate any redundancies.

3. Definitions: Create a glossary of all important terms and concepts, organized alphabetically.

4. Resources: Compile all mentioned resources into a single list.

5. Structure your cheatsheet with clear headings and subheadings. Use markdown formatting for improved readability:
   - Use # for main headings, ## for subheadings
   - Use bullet points for lists
   - Use bold for emphasis on important points
   - Use code blocks for any code snippets or command-line instructions

Your final output should be a well-organized, easy-to-navigate cheatsheet that captures the essence of the entire video in a format that's quick to reference and understand. Ensure all content is in ${language}.

Do that on the following text:
{text}
  `);

    return loadSummarizationChain(model, {
      type: 'map_reduce',
      mapPrompt: mapPrompt,
      combinePrompt: combinePrompt,
    } as any);
  }

  private async generateStructuredOutput(
    model: ChatOpenAI,
    text: string,
    language: string,
  ) {
    this.logger.debug('Generating structured output...');

    const schema = z.object({
      summary: z.array(z.string()).describe('Consolidated list of main topics or concepts discussed.'),
      definitions: z.array(z.string()).describe('Consolidated list of main topics or concepts discussed.'),
      resources: z.array(z.string()).describe('All mentioned resources.'),
    });

    const structuredLLM = model.withStructuredOutput(schema, {
      strict: true,
    });

    const structuredOutputPrompt = PromptTemplate.fromTemplate(`
Based on the comprehensive cheatsheet you've created in ${language}, generate a structured JSON output. Follow this format:

1. Summary: Begin with a brief (2-3 sentences) overview of the entire video's main topics.

2. Key Points: Compile and organize all the key points from each section. Group related points together under relevant subheadings. Eliminate any redundancies.

3. Definitions: Create a glossary of all important terms and concepts, organized alphabetically.

4. Resources: Compile all mentioned resources into a single list.

Ensure that all content is accurately represented in the JSON structure and is in ${language}. If any section is empty, include it with an empty array or object as appropriate. Escape any special characters in the JSON strings to ensure valid JSON output.

Do that on the following text:
{text}
    `);

    return await structuredLLM.invoke(
      await structuredOutputPrompt.formatPromptValue({ text }),
    );
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
