import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTitleToYoutubeVideo1728164397726 implements MigrationInterface {
  name = 'AddTitleToYoutubeVideo1728164397726';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "youtube_videos" ADD "title" character varying(255)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "youtube_videos" DROP COLUMN "title"`);
  }
}
