import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Cheatsheet } from '../cheatsheets/cheatsheet.entity';

export enum VideoProcessingStatus {
  PENDING = 'pending',
  AUDIO_FETCHED = 'audio_fetched',
  TRANSCRIPT_GENERATED = 'transcript_generated',
  TOPICS_FETCHED = 'topics_fetched',
}

@Entity('youtube_videos')
export class YoutubeVideo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'youtube_id', unique: true })
  youtubeId: string;

  @Column({
    name: 'processing_status',
    type: 'enum',
    enum: VideoProcessingStatus,
    default: VideoProcessingStatus.PENDING,
  })
  processingStatus: VideoProcessingStatus;

  @Column({ name: 'audio_url', nullable: true })
  audioUrl: string;

  @Column({ name: 'transcript_url', nullable: true })
  transcriptUrl: string;

  @Column({ name: 'discussion_topics', type: 'jsonb', nullable: true })
  discussionTopics: object;

  @Column({ length: 10, nullable: true })
  language: string | null;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @Column({ length: 255, nullable: true })
  title: string | null;

  @Column({ length: 255, nullable: true })
  thumbnailUrl: string | null;

  @OneToMany(() => Cheatsheet, (cheatsheet) => cheatsheet.video)
  cheatsheets: Cheatsheet[];

  get cheatsheetCount(): number {
    return this.cheatsheets ? this.cheatsheets.length : 0;
  }

  @Column({ type: 'text', nullable: true })
  persona: string | null;

  @Column({ name: 'main_theme', type: 'text', nullable: true })
  mainTheme: string | null;
}
