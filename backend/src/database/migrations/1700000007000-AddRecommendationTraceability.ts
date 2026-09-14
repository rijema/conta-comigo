import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRecommendationTraceability1700000007000 implements MigrationInterface {
  name = 'AddRecommendationTraceability1700000007000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "recommendation_outcome_status_enum" AS ENUM ('PRESENTED', 'STARTED', 'COMPLETED', 'SKIPPED', 'ABANDONED')`);
    await queryRunner.query(`CREATE TABLE "recommendation_outcomes" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "recommendationId" UUID NOT NULL UNIQUE REFERENCES "ade_decisions"("id"),
      "studentId" UUID NOT NULL REFERENCES "users"("id"), "sessionId" VARCHAR NOT NULL,
      "activityId" UUID NOT NULL REFERENCES "activities"("id"), "status" "recommendation_outcome_status_enum" NOT NULL,
      "presentedAt" TIMESTAMPTZ, "startedAt" TIMESTAMPTZ, "completedAt" TIMESTAMPTZ, "skippedAt" TIMESTAMPTZ,
      "attempts" INTEGER NOT NULL DEFAULT 0, "hintsUsed" INTEGER NOT NULL DEFAULT 0,
      "instructionReplays" INTEGER NOT NULL DEFAULT 0, "responseTimeMs" INTEGER, "correct" BOOLEAN,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )`);
    await queryRunner.query(`CREATE TABLE "adaptation_transitions" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "studentId" UUID NOT NULL REFERENCES "users"("id"),
      "sessionId" VARCHAR NOT NULL, "previousRecommendationId" UUID NOT NULL UNIQUE REFERENCES "ade_decisions"("id"),
      "previousActivityId" UUID NOT NULL REFERENCES "activities"("id"), "triggerEventId" UUID NOT NULL UNIQUE REFERENCES "learning_events"("id"),
      "triggerType" VARCHAR NOT NULL, "changeRequested" BOOLEAN NOT NULL DEFAULT false,
      "replacementRecommendationId" UUID REFERENCES "ade_decisions"("id"),
      "replacementActivityId" UUID REFERENCES "activities"("id"), "sameBNCCSkill" BOOLEAN,
      "sameMathematicalConcept" BOOLEAN, "interactionTypeChanged" BOOLEAN, "representationChanged" BOOLEAN,
      "motorDemandDelta" DOUBLE PRECISION, "sensoryLoadDelta" DOUBLE PRECISION,
      "languageLoadDelta" DOUBLE PRECISION, "scaffoldingDelta" DOUBLE PRECISION, "difficultyDelta" DOUBLE PRECISION,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )`);
    await queryRunner.query(`CREATE TABLE "interaction_evidence" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "sourceEventId" UUID NOT NULL UNIQUE REFERENCES "learning_events"("id"),
      "studentId" UUID NOT NULL REFERENCES "users"("id"), "sessionId" VARCHAR NOT NULL,
      "activityId" UUID NOT NULL REFERENCES "activities"("id"), "recommendationId" UUID REFERENCES "ade_decisions"("id"),
      "eventType" VARCHAR NOT NULL, "interactionType" JSONB, "representation" JSONB,
      "motorDemand" VARCHAR, "sensoryLoad" VARCHAR, "languageLoad" VARCHAR, "outcome" VARCHAR,
      "timestamp" TIMESTAMPTZ NOT NULL, "metadata" JSONB
    )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "interaction_evidence"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "adaptation_transitions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "recommendation_outcomes"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "recommendation_outcome_status_enum"`);
  }
}
