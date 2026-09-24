import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExercisePerformanceTracking1726900000000 implements MigrationInterface {
  name = 'AddExercisePerformanceTracking1726900000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exercise_performance" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "activityId" uuid NOT NULL,
        "islandId" varchar,
        "sessionId" varchar,
        "attemptNumber" integer NOT NULL DEFAULT 1,
        "isCorrect" boolean NOT NULL DEFAULT false,
        "score" float NOT NULL DEFAULT 0,
        "responseTimeMs" integer,
        "hintsUsed" integer NOT NULL DEFAULT 0,
        "tutorialOpenedCount" integer NOT NULL DEFAULT 0,
        "instructionReplayCount" integer NOT NULL DEFAULT 0,
        "skipped" boolean NOT NULL DEFAULT false,
        "timeBeforeSkipMs" integer,
        "metadata" jsonb,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "FK_exercise_performance_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_exercise_performance_activity" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_exercise_performance_user_activity" 
      ON "exercise_performance"("userId", "activityId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_exercise_performance_user_island" 
      ON "exercise_performance"("userId", "islandId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_exercise_performance_user_created" 
      ON "exercise_performance"("userId", "createdAt")
    `);
  }

  async down(): Promise<void> {
    // Performance tracking is append-only for analytics integrity.
  }
}
