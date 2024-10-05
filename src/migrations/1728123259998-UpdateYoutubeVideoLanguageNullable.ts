import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateYoutubeVideoLanguageNullable1728123259998
  implements MigrationInterface
{
  name = 'UpdateYoutubeVideoLanguageNullable1728123259998';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "youtube_videos" ALTER COLUMN "language" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "youtube_videos" ALTER COLUMN "language" SET NOT NULL`,
    );
  }
}
