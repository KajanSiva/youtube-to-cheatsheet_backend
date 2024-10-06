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

const unlink = promisify(fs.unlink);

@Injectable()
@Processor('video-processing')
export class VideoProcessingConsumer {
  private readonly logger = new Logger(VideoProcessingConsumer.name);
  private readonly openai: OpenAI;
  private readonly MAX_CHUNK_SIZE = 23 * 1024 * 1024; // 23MB in bytes

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
    // await this.fetchTopics(video);

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

      // Download and process audio
      await youtubeDl(youtubeUrl, {
        output: tempOutputPath,
        extractAudio: true,
        audioFormat: 'mp3',
      });

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
        const targetChunkDuration = (maxChunkSize * 8) / bitrate;

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
  ): Promise<{ text: string; segments: any[] }> {
    const transcripts = {
      text: '',
      segments: [],
    };

    for (let i = 0; i < chunks.length; i++) {
      const [start, end] = chunks[i];
      const transcript = await this.transcribeChunk(filePath, start, end, i);
      transcripts.text += transcript.text;
      const segmentOffset = transcripts.segments.length;
      const timeOffset = start;
      transcripts.segments.push(
        ...transcript.segments.map((segment) => ({
          ...segment,
          id: segment.id + segmentOffset,
          seek: segment.seek + segmentOffset,
          start: segment.start + timeOffset,
          end: segment.end + timeOffset,
        })),
      );
    }

    return transcripts;
  }

  private async transcribeChunk(
    filePath: string,
    start: number,
    end: number,
    chunkNumber: number,
  ): Promise<{ text: string; segments: any[] }> {
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
        response_format: 'verbose_json',
        timestamp_granularities: ['segment'],
      });

      await unlink(chunkPath);
      this.logger.debug(`Chunk ${chunkNumber} transcribed successfully`);

      return {
        text: transcript.text,
        segments: transcript.segments.map((segment) => ({
          id: segment.id,
          seek: segment.seek,
          start: segment.start,
          end: segment.end,
          text: segment.text,
          tokens: segment.tokens,
        })),
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
    // TODO: Implement topic fetching logic
    video.discussionTopics = { topics: ['Dummy topic 1', 'Dummy topic 2'] };
    video.processingStatus = VideoProcessingStatus.TOPICS_FETCHED;
    await this.youtubeVideoRepository.save(video);
  }
}
