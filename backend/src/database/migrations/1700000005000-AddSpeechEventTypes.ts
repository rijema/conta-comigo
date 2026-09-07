import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSpeechEventTypes1700000005000 implements MigrationInterface {
  name = 'AddSpeechEventTypes1700000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const eventType of [
      'instruction_spoken',
      'instruction_replayed',
      'hint_spoken',
      'pictogram_spoken',
      'speech_disabled',
    ]) {
      await queryRunner.query(
        `ALTER TYPE "learning_event_type_enum" ADD VALUE IF NOT EXISTS '${eventType}'`,
      );
    }
  }

  public async down(): Promise<void> {
    // Values remain readable because LearningEvent history is append-only.
  }
}
