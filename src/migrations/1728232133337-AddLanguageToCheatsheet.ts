import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLanguageToCheatsheet1728232133337
  implements MigrationInterface
{
  name = 'AddLanguageToCheatsheet1728232133337';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cheatsheets" ADD "language" character varying(10) NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "cheatsheets" DROP COLUMN "language"`);
  }
}
