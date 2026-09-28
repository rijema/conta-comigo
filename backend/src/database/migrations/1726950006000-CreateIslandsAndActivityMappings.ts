import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIslandsAndActivityMappings1726950006000
  implements MigrationInterface
{
  name = 'CreateIslandsAndActivityMappings1726950006000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Create islands table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "islands" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "islandId" varchar(50) NOT NULL UNIQUE,
        "name" varchar(100) NOT NULL,
        "description" text,
        "theme" varchar(100) NOT NULL,
        "arasaacPictogramIds" jsonb NOT NULL DEFAULT '[]',
        "bnccSkills" jsonb NOT NULL DEFAULT '[]',
        "sequenceOrder" integer NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create island_activity_mappings table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "island_activity_mappings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "islandId" varchar(50) NOT NULL REFERENCES "islands"("islandId") ON DELETE CASCADE,
        "activityId" uuid NOT NULL REFERENCES "activities"("id") ON DELETE CASCADE,
        "sequenceInIsland" integer NOT NULL,
        "difficulty" varchar(20) NOT NULL,
        "modality" varchar(50) NOT NULL,
        "customTitle" varchar(255),
        "customInstructions" text,
        "scaffolding" jsonb,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("islandId", "activityId")
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_islands_island_id" ON "islands"("islandId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_island_activity_mappings_island_id" 
      ON "island_activity_mappings"("islandId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_island_activity_mappings_activity_id" 
      ON "island_activity_mappings"("activityId")
    `);

    // Insert the 3 initial islands
    await queryRunner.query(`
      INSERT INTO "islands" ("islandId", "name", "description", "theme", "sequenceOrder", "arasaacPictogramIds", "bnccSkills")
      VALUES
        (
          'island-numbers',
          'Ilha dos Números',
          'Explore o mundo dos números através de contagem, sequência e operações matemáticas básicas',
          'numbers',
          1,
          '["23190", "23191", "23192"]'::jsonb,
          '["EF01MA01", "EF01MA02", "EF01MA03", "EF01MA06", "EF01MA08"]'::jsonb
        ),
        (
          'island-colors',
          'Ilha das Cores',
          'Descubra as cores, padrões e classificações através de atividades visuais e interativas',
          'colors',
          2,
          '["61042", "61043", "61044"]'::jsonb,
          '["EF01MA14", "EF01MA03"]'::jsonb
        ),
        (
          'island-beach',
          'Ilha da Praia',
          'Aprenda com elementos da praia: areia, água, sol, conchas e diversão ao ar livre',
          'beach',
          3,
          '["23189", "23190", "23191"]'::jsonb,
          '["EF01MA01", "EF01MA02", "EF01MA03", "EF01MA06"]'::jsonb
        )
      ON CONFLICT ("islandId") DO NOTHING
    `);
  }

  async down(): Promise<void> {
    // Islands are foundational for learning structure
  }
}
