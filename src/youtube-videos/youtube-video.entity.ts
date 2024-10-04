import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum VideoProcessingStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
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

  @Column({ length: 10 })
  language: string;

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
}
