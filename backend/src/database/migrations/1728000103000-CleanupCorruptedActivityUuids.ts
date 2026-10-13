import { MigrationInterface, QueryRunner } from 'typeorm';

export class CleanupCorruptedActivityUuids1728000103000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove any activity_attempts with invalid (corrupted) UUID references
    // Valid UUIDs contain only hex characters [0-9a-f] and hyphens
    // NOTE: the real column is camelCase "activityId" (see schema.sql /
    // InitialSchema), not snake_case activity_id — must be quoted or
    // Postgres folds it to lowercase and fails with "column does not exist".
    await queryRunner.query(`
      DELETE FROM activity_attempts 
      WHERE "activityId"::text ~ '[g-z]' 
      OR "activityId"::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This migration only removes corrupted data; no rollback needed
  }
}
