import { MigrationInterface, QueryRunner } from 'typeorm';

export class BaselineProductionSchema1728000000000 implements MigrationInterface {
  name = 'BaselineProductionSchema1728000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.startTransaction();
    try {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "typeorm_migrations" (
        "id" SERIAL PRIMARY KEY,
        "timestamp" bigint NOT NULL,
        "name" varchar NOT NULL
      )
    `);

    await queryRunner.query(`
      INSERT INTO "typeorm_migrations" ("timestamp", "name")
      SELECT v.timestamp, v.name
      FROM (VALUES
        (1700000000000, 'InitialSchema1700000000000'),
        (1700000001000, 'AddLearningEvents1700000001000'),
        (1700000002000, 'AddStudentSkillStates1700000002000'),
        (1700000003000, 'AddParametricActivityFamilies1700000003000'),
        (1700000004000, 'AddVisualCommunicationEventTypes1700000004000'),
        (1700000005000, 'AddSpeechEventTypes1700000005000'),
        (1700000006000, 'AddHybridRecommendationDecision1700000006000'),
        (1700000007000, 'AddRecommendationTraceability1700000007000'),
        (1700000008000, 'AddProfessionalRecommendationFeedback1700000008000'),
        (1700000009000, 'AddVoiceInteractionEventTypes1700000009000'),
        (1700000010000, 'AddAttemptResearchTrace1700000010000'),
        (1726868400000, 'Add77ExercisesBreakingCycle1726868400000')
      ) AS v("timestamp", "name")
      WHERE NOT EXISTS (
        SELECT 1
        FROM "typeorm_migrations" tm
        WHERE tm."timestamp" = v.timestamp AND tm."name" = v.name
      )
    `);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }
  }

  public async down(): Promise<void> {
    // Baseline migration should not be rolled back.
  }
}
