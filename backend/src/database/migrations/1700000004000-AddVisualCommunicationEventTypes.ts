import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVisualCommunicationEventTypes1700000004000 implements MigrationInterface {
  name = 'AddVisualCommunicationEventTypes1700000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "learning_event_type_enum" ADD VALUE IF NOT EXISTS 'pictogram_opened'`);
    await queryRunner.query(`ALTER TYPE "learning_event_type_enum" ADD VALUE IF NOT EXISTS 'visual_library_opened'`);
    await queryRunner.query(`ALTER TYPE "learning_event_type_enum" ADD VALUE IF NOT EXISTS 'visual_library_item_selected'`);
  }

  public async down(): Promise<void> {
    // PostgreSQL enum values are intentionally retained: historical append-only
    // events may reference them and must never be made unreadable.
  }
}
