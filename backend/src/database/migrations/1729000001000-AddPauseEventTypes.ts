import { MigrationInterface, QueryRunner } from 'typeorm';

export const PAUSE_EVENT_TYPES = ['PAUSE_SUGGESTED', 'PAUSE_STARTED', 'PAUSE_ENDED'] as const;

export class AddPauseEventTypes1729000001000 implements MigrationInterface {
  name = 'AddPauseEventTypes1729000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Guarded so startup never crashes on databases where learning events
    // were not provisioned yet (the enum is created together with the table).
    for (const eventType of PAUSE_EVENT_TYPES) {
      await queryRunner.query(`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'learning_event_type_enum') THEN
            ALTER TYPE "learning_event_type_enum" ADD VALUE IF NOT EXISTS '${eventType}';
          END IF;
        END $$;
      `);
    }
  }

  public async down(): Promise<void> {
    // Values remain readable because LearningEvent history is append-only.
  }
}
