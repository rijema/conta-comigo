import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfessionalRecommendationFeedback1700000008000 implements MigrationInterface {
  name = 'AddProfessionalRecommendationFeedback1700000008000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "adaptation_transitions" ADD COLUMN IF NOT EXISTS "difficultyDelta" DOUBLE PRECISION`);
    await queryRunner.query(`ALTER TABLE "adaptation_transitions" ADD COLUMN IF NOT EXISTS "changeRequested" BOOLEAN NOT NULL DEFAULT false`);
    await queryRunner.query(`CREATE TYPE "professional_feedback_rating_enum" AS ENUM ('ADEQUATE', 'PARTIALLY_ADEQUATE', 'INADEQUATE')`);
    await queryRunner.query(`CREATE TABLE "professional_recommendation_feedback" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "transitionId" UUID NOT NULL REFERENCES "adaptation_transitions"("id"),
      "recommendationId" UUID NOT NULL REFERENCES "ade_decisions"("id"), "sessionId" VARCHAR NOT NULL,
      "studentId" UUID NOT NULL REFERENCES "users"("id"), "professionalId" UUID NOT NULL REFERENCES "users"("id"),
      "rating" "professional_feedback_rating_enum" NOT NULL, "reasonCodes" JSONB NOT NULL DEFAULT '[]',
      "optionalComment" TEXT, "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE ("transitionId", "professionalId")
    )`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "professional_recommendation_feedback"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "professional_feedback_rating_enum"`);
    await queryRunner.query(`ALTER TABLE "adaptation_transitions" DROP COLUMN IF EXISTS "difficultyDelta"`);
    await queryRunner.query(`ALTER TABLE "adaptation_transitions" DROP COLUMN IF EXISTS "changeRequested"`);
  }
}
