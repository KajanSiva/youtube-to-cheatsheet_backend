import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPersonaAndMainThemeToYoutubeVideo1728746137147
  implements MigrationInterface
{
  name = 'AddPersonaAndMainThemeToYoutubeVideo1728746137147';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "youtube_videos" ADD "persona" text`);
    await queryRunner.query(
      `ALTER TABLE "youtube_videos" ADD "main_theme" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "youtube_videos" DROP COLUMN "main_theme"`,
    );
    await queryRunner.query(
      `ALTER TABLE "youtube_videos" DROP COLUMN "persona"`,
    );
  }
}
