import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { YoutubeVideo } from '../youtube-videos/youtube-video.entity';

export enum CheatsheetProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  DONE = 'done',
  FAILED = 'failed',
}

@Entity('cheatsheets')
export class Cheatsheet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => YoutubeVideo, (video) => video.cheatsheets)
  @JoinColumn({ name: 'video_id' })
  video: YoutubeVideo;

  @Column({
    name: 'processing_status',
    type: 'enum',
    enum: CheatsheetProcessingStatus,
    default: CheatsheetProcessingStatus.PENDING,
  })
  processingStatus: CheatsheetProcessingStatus;

  @Column('jsonb', { name: 'needed_topics', nullable: true })
  neededTopics: string[];

  @Column('jsonb', { nullable: true })
  content: object;

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

  @Column({ nullable: true })
  error: string;

  @Column({ length: 10, nullable: true })
  language: string;

  @Column({ type: 'text', nullable: true })
  comment: string;
}
