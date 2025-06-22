import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserTable1750567389267 implements MigrationInterface {
    name = 'AddUserTable1750567389267'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" varchar PRIMARY KEY NOT NULL, "email" varchar NOT NULL, "password" varchar NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"))`);
        await queryRunner.query(`CREATE TABLE "history_item" ("id" varchar PRIMARY KEY NOT NULL, "question" varchar NOT NULL, "domain" varchar NOT NULL, "answer" text NOT NULL, "timestamp" datetime NOT NULL DEFAULT (datetime('now')))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "history_item"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
