import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCheatsheetEntity1728230225411 implements MigrationInterface {
  name = 'AddCheatsheetEntity1728230225411';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."cheatsheets_processing_status_enum" AS ENUM('pending', 'processing', 'done', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "cheatsheets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "processing_status" "public"."cheatsheets_processing_status_enum" NOT NULL DEFAULT 'pending', "needed_topics" jsonb, "content" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "error" character varying, "video_id" uuid, CONSTRAINT "PK_1537215564e447791051e747e96" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "cheatsheets" ADD CONSTRAINT "FK_ef5493bad363cb4a3f3bf50497e" FOREIGN KEY ("video_id") REFERENCES "youtube_videos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cheatsheets" DROP CONSTRAINT "FK_ef5493bad363cb4a3f3bf50497e"`,
    );
    await queryRunner.query(`DROP TABLE "cheatsheets"`);
    await queryRunner.query(
      `DROP TYPE "public"."cheatsheets_processing_status_enum"`,
    );
  }
}
