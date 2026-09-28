import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIslandContextToAdeDecision1726950007000
  implements MigrationInterface
{
  name = 'AddIslandContextToAdeDecision1726950007000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Update adeDecisionContext JSONB column to include island context
    // This is a schema-less update, so we just document the new fields

    // Add island-related columns to ade_decisions table if it exists
    await queryRunner.query(`
      ALTER TABLE "ade_decisions" 
      ADD COLUMN IF NOT EXISTS "recommendedIslandId" varchar(50)
    `);

    await queryRunner.query(`
      ALTER TABLE "ade_decisions" 
      ADD COLUMN IF NOT EXISTS "sequenceInIsland" integer
    `);

    // Create index for island-based queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ade_decisions_island_id" 
      ON "ade_decisions"("recommendedIslandId")
    `);

    // Update activity_attempts to ensure islandId is tracked
    // (This column already exists from previous migration)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_activity_attempts_island_id" 
      ON "activity_attempts"("islandId")
    `);
  }

  async down(): Promise<void> {
    // Island context is foundational for learning structure
  }
}
