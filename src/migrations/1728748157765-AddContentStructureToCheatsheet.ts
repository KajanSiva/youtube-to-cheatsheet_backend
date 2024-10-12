import { MigrationInterface, QueryRunner } from "typeorm";

export class AddContentStructureToCheatsheet1728748157765 implements MigrationInterface {
    name = 'AddContentStructureToCheatsheet1728748157765'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cheatsheets" ADD "contentStructure" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cheatsheets" DROP COLUMN "contentStructure"`);
    }

}
