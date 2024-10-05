import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateYoutubeVideo1728083926401 implements MigrationInterface {
  name = 'CreateYoutubeVideo1728083926401';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."youtube_videos_processing_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed')`,
    );

    await queryRunner.query(
      `CREATE TABLE "youtube_videos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "youtube_id" character varying NOT NULL, "processing_status" "public"."youtube_videos_processing_status_enum" NOT NULL DEFAULT 'pending', "audio_url" character varying, "transcript_url" character varying, "discussion_topics" jsonb, "language" character varying(10) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_9ef9a7486179086fdf8da4e1586" UNIQUE ("youtube_id"), CONSTRAINT "PK_1a41d24a1ea34c746430493b2e6" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "youtube_videos"`);

    await queryRunner.query(
      `DROP TYPE "public"."youtube_videos_processing_status_enum"`,
    );
  }
}
