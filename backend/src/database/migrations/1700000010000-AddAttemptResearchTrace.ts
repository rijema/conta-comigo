import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAttemptResearchTrace1700000010000 implements MigrationInterface {
  name = 'AddAttemptResearchTrace1700000010000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "activity_attempts" ADD COLUMN IF NOT EXISTS "researchTrace" JSONB');
    await queryRunner.query('ALTER TYPE "learning_event_type_enum" ADD VALUE IF NOT EXISTS \'ACTIVITY_ABANDONED\'');
    await queryRunner.query('ALTER TABLE "recommendation_outcomes" ADD COLUMN IF NOT EXISTS "abandonedAt" TIMESTAMPTZ');
  }

  async down(): Promise<void> {
    // Research events and evidence remain append-only.
  }
}
