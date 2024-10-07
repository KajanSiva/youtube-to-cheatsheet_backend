import { Processor, Process } from '@nestjs/bull';
import { Logger, Injectable } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { YoutubeVideo, VideoProcessingStatus } from './youtube-video.entity';
import { StorageService } from '../common/storage/storage.interface';
import { youtubeDl } from 'youtube-dl-exec';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import { OpenAI } from 'openai';
import * as ffmpeg from 'fluent-ffmpeg';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from 'langchain/document';
import { PromptTemplate } from '@langchain/core/prompts';
import { loadSummarizationChain } from 'langchain/chains';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';

const unlink = promisify(fs.unlink);

@Injectable()
@Processor('video-processing')
export class VideoProcessingConsumer {
  private readonly logger = new Logger(VideoProcessingConsumer.name);
  private readonly openai: OpenAI;
  private readonly MAX_CHUNK_SIZE = 18 * 1024 * 1024; // Reduced to 18MB for safety

  constructor(
    @InjectRepository(YoutubeVideo)
    private youtubeVideoRepository: Repository<YoutubeVideo>,
    private storageService: StorageService,
  ) {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  @Process('process-video')
  async handleProcessVideo(job: Job<{ videoId: string }>) {
    this.logger.debug('Start processing video');
    this.logger.debug(job.data);

    const video = await this.getVideo(job.data.videoId);
    await this.fetchVideoTitle(video);
    await this.fetchAudio(video);
    await this.generateTranscript(video);
    await this.fetchTopics(video);

    this.logger.debug('Finished processing video');
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

  private async fetchVideoTitle(video: YoutubeVideo): Promise<void> {
    try {
      const youtubeUrl = `https://www.youtube.com/watch?v=${video.youtubeId}`;

      // Get video info
      const output = await youtubeDl(youtubeUrl, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
      });

      // TODO: check why output is not typed properly
      const title = (output as { title: string }).title;

      // Update video entity with the title
      video.title = title;
      await this.youtubeVideoRepository.save(video);

      this.logger.debug(`Video title fetched: ${title}`);
    } catch (error) {
      this.logger.error(`Error fetching video title: ${error.message}`);
      throw error;
    }
  }

  private async fetchAudio(video: YoutubeVideo): Promise<void> {
    try {
      const youtubeUrl = `https://www.youtube.com/watch?v=${video.youtubeId}`;
      const audioFileName = `${video.youtubeId}.mp3`;
      const tempOutputPath = path.join('/tmp', audioFileName);

      this.logger.debug(`Attempting to download audio from: ${youtubeUrl}`);
      this.logger.debug(`Temporary output path: ${tempOutputPath}`);

      // Download and process audio
      const youtubeDlOutput = await youtubeDl(youtubeUrl, {
        output: tempOutputPath,
        extractAudio: true,
        audioFormat: 'mp3',
        verbose: true, // Add verbose output for debugging
      });

      this.logger.debug(`youtube-dl output: ${JSON.stringify(youtubeDlOutput, null, 2)}`);

      // Check if the file exists before proceeding
      if (!fs.existsSync(tempOutputPath)) {
        throw new Error(`Audio file was not created at ${tempOutputPath}`);
      }

      // Read the file and save it using StorageService
      const audioBuffer = await this.storageService.readFile(tempOutputPath);
      const audioFilePath = await this.storageService.saveFile(
        audioFileName,
        audioBuffer,
      );

      // Update video entity
      video.audioUrl = audioFilePath;
      video.processingStatus = VideoProcessingStatus.AUDIO_FETCHED;
      await this.youtubeVideoRepository.save(video);

      // Clean up temporary file
      await this.storageService.deleteFile(tempOutputPath);

      this.logger.debug(`Audio fetched and saved: ${audioFilePath}`);
    } catch (error) {
      this.logger.error(`Error fetching audio: ${error.message}`);
      if (error.stderr) {
        this.logger.error(`youtube-dl stderr: ${error.stderr}`);
      }
      throw error;
    }
  }

  private async generateTranscript(video: YoutubeVideo): Promise<void> {
    try {
      const chunks = await this.splitAudio(video.audioUrl);
      this.logger.debug(`Audio split into ${chunks.length} chunks`);

      const transcripts = await this.transcribeChunks(video.audioUrl, chunks);

      const transcriptFileName = `${video.youtubeId}_transcript.json`;
      const transcriptBuffer = Buffer.from(
        JSON.stringify(transcripts, null, 2),
      );
      const transcriptFilePath = await this.storageService.saveFile(
        transcriptFileName,
        transcriptBuffer,
      );

      video.transcriptUrl = transcriptFilePath;
      video.processingStatus = VideoProcessingStatus.TRANSCRIPT_GENERATED;
      await this.youtubeVideoRepository.save(video);

      this.logger.debug(
        `Transcript generated and saved: ${transcriptFilePath}`,
      );
    } catch (error) {
      this.logger.error(`Error generating transcript: ${error.message}`);
      throw error;
    }
  }

  private splitAudio(
    filePath: string,
    maxChunkSize = this.MAX_CHUNK_SIZE,
    minSilenceLen = 0.5,
    silenceThresh = -40,
  ): Promise<number[][]> {
    return new Promise((resolve, reject) => {
      const chunks: number[][] = [];
      let currentChunk = [0];
      let lastSilenceEnd = 0;

      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          this.logger.error(`Error in ffprobe: ${err.message}`);
          reject(err);
          return;
        }

        const duration = metadata.format.duration;
        const bitrate = metadata.format.bit_rate;
        const targetChunkDuration = ((maxChunkSize * 8) / bitrate) * 0.8; // Reduce target duration by 20%

        this.logger.debug(
          `Audio duration: ${duration}, bitrate: ${bitrate}, target chunk duration: ${targetChunkDuration}`,
        );

        ffmpeg(filePath)
          .audioFilters(
            `silencedetect=noise=${silenceThresh}dB:d=${minSilenceLen}`,
          )
          .format('null')
          .on('stderr', (line) => {
            const silenceEnd = line.match(/silence_end: (\d+\.\d+)/);
            const silenceStart = line.match(/silence_start: (\d+\.\d+)/);

            if (silenceEnd) {
              const end = parseFloat(silenceEnd[1]);
              if (end - lastSilenceEnd >= targetChunkDuration) {
                currentChunk.push(end);
                chunks.push(currentChunk);
                currentChunk = [end];
                lastSilenceEnd = end;
                this.logger.debug(`Chunk added: [${currentChunk[0]}, ${end}]`);
              }
            } else if (silenceStart) {
              const start = parseFloat(silenceStart[1]);
              if (start - lastSilenceEnd >= targetChunkDuration) {
                currentChunk.push(start);
                chunks.push(currentChunk);
                currentChunk = [start];
                lastSilenceEnd = start;
                this.logger.debug(
                  `Chunk added: [${currentChunk[0]}, ${start}]`,
                );
              }
            }
          })
          .on('end', () => {
            if (currentChunk.length > 1) {
              chunks.push(currentChunk);
              this.logger.debug(
                `Final chunk added: [${currentChunk[0]}, ${currentChunk[1]}]`,
              );
            }

            if (chunks.length === 0) {
              this.logger.warn(
                'No audio chunks were generated. Using entire audio as one chunk.',
              );
              chunks.push([0, duration]);
            } else if (chunks[chunks.length - 1][1] < duration) {
              const lastChunk = [chunks[chunks.length - 1][1], duration];
              chunks.push(lastChunk);
              this.logger.debug(
                `Added final chunk to cover remaining duration: [${lastChunk[0]}, ${lastChunk[1]}]`,
              );
            }

            this.logger.debug(`Total chunks generated: ${chunks.length}`);
            resolve(chunks);
          })
          .on('error', (error) => {
            this.logger.error(`Error in ffmpeg processing: ${error.message}`);
            reject(error);
          })
          .output('/dev/null')
          .run();
      });
    });
  }

  private async transcribeChunks(
    filePath: string,
    chunks: number[][],
  ): Promise<{ text: string; }> {
    const transcripts = {
      text: '',
    };

    for (let i = 0; i < chunks.length; i++) {
      const [start, end] = chunks[i];
      const transcript = await this.transcribeChunk(filePath, start, end, i);
      transcripts.text += transcript.text;
    }

    return transcripts;
  }

  private async transcribeChunk(
    filePath: string,
    start: number,
    end: number,
    chunkNumber: number,
  ): Promise<{ text: string; }> {
    try {
      const chunkPath = `/tmp/temp_chunk_${chunkNumber}.mp3`;
      this.logger.debug(
        `Processing chunk ${chunkNumber}: ${start.toFixed(2)} - ${end.toFixed(2)}`,
      );

      await new Promise((resolve, reject) => {
        ffmpeg(filePath)
          .setStartTime(start)
          .setDuration(end - start)
          .output(chunkPath)
          .outputFormat('mp3')
          .on('end', resolve)
          .on('error', reject)
          .run();
      });

      const transcript = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(chunkPath),
        model: 'whisper-1',
        response_format: 'json',
      });

      await unlink(chunkPath);
      this.logger.debug(`Chunk ${chunkNumber} transcribed successfully`);

      return {
        text: transcript.text,
      };
    } catch (error) {
      this.logger.error(
        `Error transcribing chunk ${chunkNumber}:`,
        error.message,
      );
      throw error;
    }
  }

  private async fetchTopics(video: YoutubeVideo): Promise<void> {
    try {
      const transcriptContent = await this.storageService.readFile(
        video.transcriptUrl,
      );
      const transcriptJson = JSON.parse(transcriptContent.toString('utf-8'));
      const transcript = transcriptJson.text;

      const docs = await this.processTranscript(transcript);
      const { structuredThemes } = await this.identifyThemes(docs);

      video.discussionTopics = structuredThemes;
      video.processingStatus = VideoProcessingStatus.TOPICS_FETCHED;
      await this.youtubeVideoRepository.save(video);

      this.logger.debug('Topics fetched and saved successfully');
    } catch (error) {
      this.logger.error(`Error fetching topics: ${error.message}`);
      throw error;
    }
  }

  private async processTranscript(transcript: string): Promise<Document[]> {
    this.logger.debug('Starting transcript processing...');

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

  private async identifyThemes(
    docs: Document[],
  ): Promise<{ structuredThemes: any }> {
    this.logger.debug('Starting theme identification...');

    const model = new ChatOpenAI({
      temperature: 0,
      modelName: 'gpt-4o-mini-2024-07-18',
    });
    const themeChain = loadSummarizationChain(model, {
      type: 'map_reduce',
      mapPrompt: PromptTemplate.fromTemplate(`
Analyze the following part of a video transcript and identify the themes or topics discussed. For each theme, provide:

- **Theme Title**: A short title summarizing the theme.
- **Description**: A brief summary explaining what is said about this theme.
- **Sub-themes** (if applicable): List of sub-topics related to the main theme.

Transcript part:
{text}

Identify the themes in this part:
      `),
      combinePrompt: PromptTemplate.fromTemplate(`
Combine and consolidate the following theme identifications from different parts of the transcript. Eliminate redundancies and organize the themes logically.

{text}

Provide a final list of main themes for the entire transcript:
      `),
    } as any); // TODO: fix type error

    this.logger.debug('Identifying themes...');
    const result = await themeChain.invoke({ input_documents: docs });

    this.logger.debug('Generating structured theme output...');
    const structuredThemes = await this.generateStructuredThemes(
      model,
      result.text,
    );

    return { structuredThemes };
  }

  private async generateStructuredThemes(model, text) {
    const themeSchema = z.object({
      themes: z.array(
        z.object({
          title: z.string().describe('A short title summarizing the theme.'),
          description: z
            .string()
            .describe(
              'A brief summary explaining what is said about this theme.',
            ),
          subThemes: z
            .array(z.string())
            .describe(
              'List of sub-topics related to the main theme. Can be an empty array if there are no sub-themes.',
            ),
        }),
      ),
    });

    const structuredLLM = model.withStructuredOutput(themeSchema, {
      strict: true,
    });
    const structuredThemePrompt = PromptTemplate.fromTemplate(`
  Generate a JSON output based on the following identified themes:
  
  {text}
  
  Create a structured output with an array of themes, each containing:
  1. title: A short title summarizing the theme.
  2. description: A brief summary explaining what is said about this theme.
  3. subThemes: An array of sub-topics related to the main theme. If there are no sub-themes, provide an empty array.
  
  Ensure that every theme has all three fields, even if subThemes is an empty array.
    `);
    return await structuredLLM.invoke(
      await structuredThemePrompt.formatPromptValue({ text }),
    );
  }
}