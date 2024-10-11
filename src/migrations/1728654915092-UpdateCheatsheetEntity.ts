import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCheatsheetEntity1728654915092 implements MigrationInterface {
  name = 'UpdateCheatsheetEntity1728654915092';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "cheatsheets" ADD "comment" text`);
    await queryRunner.query(
      `ALTER TABLE "cheatsheets" ALTER COLUMN "language" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cheatsheets" ALTER COLUMN "language" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "cheatsheets" DROP COLUMN "comment"`);
  }
}
