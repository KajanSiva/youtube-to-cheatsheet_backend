import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddThumbnailUrlToVideo1728336885662 implements MigrationInterface {
  name = 'AddThumbnailUrlToVideo1728336885662';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "youtube_videos" ADD "thumbnailUrl" character varying(255)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "youtube_videos" DROP COLUMN "thumbnailUrl"`,
    );
  }
}
