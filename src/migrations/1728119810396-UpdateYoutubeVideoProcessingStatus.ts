import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateYoutubeVideoProcessingStatus1728119810396
  implements MigrationInterface
{
  name = 'UpdateYoutubeVideoProcessingStatus1728119810396';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."youtube_videos_processing_status_enum" RENAME TO "youtube_videos_processing_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."youtube_videos_processing_status_enum" AS ENUM('pending', 'audio_fetched', 'transcript_generated', 'topics_fetched')`,
    );
    await queryRunner.query(
      `ALTER TABLE "youtube_videos" ALTER COLUMN "processing_status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "youtube_videos" ALTER COLUMN "processing_status" TYPE "public"."youtube_videos_processing_status_enum" USING "processing_status"::"text"::"public"."youtube_videos_processing_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "youtube_videos" ALTER COLUMN "processing_status" SET DEFAULT 'pending'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."youtube_videos_processing_status_enum_old"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."youtube_videos_processing_status_enum_old" AS ENUM('pending', 'in_progress', 'done')`,
    );
    await queryRunner.query(
      `ALTER TABLE "youtube_videos" ALTER COLUMN "processing_status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "youtube_videos" ALTER COLUMN "processing_status" TYPE "public"."youtube_videos_processing_status_enum_old" USING "processing_status"::"text"::"public"."youtube_videos_processing_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "youtube_videos" ALTER COLUMN "processing_status" SET DEFAULT 'pending'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."youtube_videos_processing_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."youtube_videos_processing_status_enum_old" RENAME TO "youtube_videos_processing_status_enum"`,
    );
  }
}
