import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIslandExercisesMapping1726900001000 implements MigrationInterface {
  name = 'AddIslandExercisesMapping1726900001000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "island_exercises_mapping" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "islandId" varchar(50) NOT NULL UNIQUE,
        "islandName" varchar(100) NOT NULL,
        "topic" varchar(100) NOT NULL,
        "bnccSkills" jsonb NOT NULL,
        "exerciseCount" integer NOT NULL,
        "exerciseTitles" jsonb NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_island_exercises_mapping_island_id" 
      ON "island_exercises_mapping"("islandId")
    `);
  }

  async down(): Promise<void> {
    // Island mappings are foundational for learning structure.
  }
}
