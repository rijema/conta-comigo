import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHybridRecommendationDecision1700000006000 implements MigrationInterface {
  name = 'AddHybridRecommendationDecision1700000006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "ade_decisions" ADD COLUMN "selectedActivityId" UUID`);
    await queryRunner.query(`ALTER TABLE "ade_decisions" ADD COLUMN "hybridRanking" JSONB`);
    await queryRunner.query(`ALTER TABLE "ade_decisions" ADD COLUMN "decisionSource" VARCHAR`);
    await queryRunner.query(`ALTER TABLE "ade_decisions" ADD COLUMN "fallbackUsed" BOOLEAN NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "ade_decisions" ADD COLUMN "fallbackReason" TEXT`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "ade_decisions" DROP COLUMN "fallbackReason"`);
    await queryRunner.query(`ALTER TABLE "ade_decisions" DROP COLUMN "fallbackUsed"`);
    await queryRunner.query(`ALTER TABLE "ade_decisions" DROP COLUMN "decisionSource"`);
    await queryRunner.query(`ALTER TABLE "ade_decisions" DROP COLUMN "hybridRanking"`);
    await queryRunner.query(`ALTER TABLE "ade_decisions" DROP COLUMN "selectedActivityId"`);
  }
}
