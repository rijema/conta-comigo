import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLearningEvents1700000001000 implements MigrationInterface {
  name = 'AddLearningEvents1700000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`
      CREATE TYPE "learning_event_type_enum" AS ENUM (
        'SESSION_STARTED', 'SESSION_COMPLETED', 'ACTIVITY_PRESENTED',
        'ACTIVITY_STARTED', 'ANSWER_SUBMITTED', 'ACTIVITY_COMPLETED',
        'ACTIVITY_SKIPPED', 'HINT_REQUESTED', 'TUTORIAL_OPENED',
        'INSTRUCTION_REPLAYED', 'RECOMMENDATION_GENERATED',
        'RECOMMENDATION_PRESENTED', 'RECOMMENDATION_COMPLETED',
        'DIFFICULTY_ADJUSTED', 'TITIA_INTERACTION'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "learning_events" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "studentId" UUID NOT NULL,
        "sessionId" VARCHAR NOT NULL,
        "eventType" "learning_event_type_enum" NOT NULL,
        "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL,
        "activityId" UUID,
        "bnccSkillId" UUID,
        "attempt" INTEGER,
        "responseTimeMs" INTEGER,
        "correct" BOOLEAN,
        "hintsUsed" INTEGER,
        "recommendationId" VARCHAR,
        "metadata" JSONB
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_learning_events_student_timestamp"
      ON "learning_events" ("studentId", "timestamp")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_learning_events_session_timestamp"
      ON "learning_events" ("sessionId", "timestamp")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_learning_events_type_timestamp"
      ON "learning_events" ("eventType", "timestamp")
    `);
    await queryRunner.query(`
      CREATE FUNCTION prevent_learning_event_mutation() RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'learning_events is append-only';
      END;
      $$ LANGUAGE plpgsql
    `);
    await queryRunner.query(`
      CREATE TRIGGER "trg_learning_events_append_only"
      BEFORE UPDATE OR DELETE ON "learning_events"
      FOR EACH ROW EXECUTE FUNCTION prevent_learning_event_mutation()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS "trg_learning_events_append_only" ON "learning_events"`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS prevent_learning_event_mutation()`);
    await queryRunner.query(`DROP TABLE IF EXISTS "learning_events"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "learning_event_type_enum"`);
  }
}
