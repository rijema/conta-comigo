import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVoiceInteractionEventTypes1700000009000 implements MigrationInterface {
  name = 'AddVoiceInteractionEventTypes1700000009000';
  async up(queryRunner: QueryRunner): Promise<void> {
    for (const value of ['VOICE_INTERACTION_STARTED', 'VOICE_COMMAND_RECOGNIZED', 'VOICE_COMMAND_UNKNOWN',
      'VOICE_HELP_REQUESTED', 'VOICE_INSTRUCTION_REPLAY_REQUESTED', 'VOICE_ACTIVITY_CHANGE_REQUESTED']) {
      await queryRunner.query(`ALTER TYPE "learning_event_type_enum" ADD VALUE IF NOT EXISTS '${value}'`);
    }
  }
  async down(): Promise<void> { /* Values remain to preserve append-only event history. */ }
}
