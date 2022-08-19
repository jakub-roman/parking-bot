import { MigrationInterface, QueryRunner } from "typeorm";

export class init1660915710441 implements MigrationInterface {
    name = 'init1660915710441'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user" ("name" character varying NOT NULL, "id" character varying NOT NULL, CONSTRAINT "PK_065d4d8f3b5adb4a08841eae3c8" PRIMARY KEY ("name"))`);
        await queryRunner.query(`CREATE TABLE "reservation" ("id" SERIAL NOT NULL, "date" date NOT NULL, "userName" character varying, "spotName" character varying, CONSTRAINT "PK_48b1f9922368359ab88e8bfa525" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_5dd94a96127aafbb906e1d5d31" ON "reservation" ("date", "spotName") `);
        await queryRunner.query(`CREATE TABLE "parking_spot" ("name" character varying NOT NULL, CONSTRAINT "PK_92e93ecd120a9b1ac5562a9365c" PRIMARY KEY ("name"))`);
        await queryRunner.query(`ALTER TABLE "reservation" ADD CONSTRAINT "FK_50e3c39e0c2175999074a7af7f8" FOREIGN KEY ("userName") REFERENCES "user"("name") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reservation" ADD CONSTRAINT "FK_5c7fc59e6d3082a758713eab8d2" FOREIGN KEY ("spotName") REFERENCES "parking_spot"("name") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reservation" DROP CONSTRAINT "FK_5c7fc59e6d3082a758713eab8d2"`);
        await queryRunner.query(`ALTER TABLE "reservation" DROP CONSTRAINT "FK_50e3c39e0c2175999074a7af7f8"`);
        await queryRunner.query(`DROP TABLE "parking_spot"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5dd94a96127aafbb906e1d5d31"`);
        await queryRunner.query(`DROP TABLE "reservation"`);
        await queryRunner.query(`DROP TABLE "user"`);
    }

}
