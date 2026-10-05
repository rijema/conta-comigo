import { MigrationInterface, QueryRunner } from 'typeorm';

export class CleanupCorruptedActivityUuids1728000103000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove any activity_attempts with invalid (corrupted) UUID references
    // Valid UUIDs contain only hex characters [0-9a-f] and hyphens
    await queryRunner.query(`
      DELETE FROM activity_attempts 
      WHERE activity_id ~ '[g-z]' 
      OR activity_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This migration only removes corrupted data; no rollback needed
  }
}
