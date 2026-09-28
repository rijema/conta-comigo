import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * [PROPOSTA CONTA COMIGO] Add remaining 3 islands to complete the 6-island structure
 * 
 * Islands 1-3 were created in 1726950006000-CreateIslandsAndActivityMappings
 * This migration adds islands 4-6 for a complete learning journey
 */
export class AddRemainingIslands1728000002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add islands 4-6
    await queryRunner.query(`
      INSERT INTO "islands" ("islandId", "name", "description", "theme", "sequenceOrder", "arasaacPictogramIds", "bnccSkills")
      VALUES
        (
          'island-body',
          'Ilha do Corpo',
          'Descubra as partes do corpo e desenvolva consciência corporal através de atividades interativas',
          'body',
          4,
          '["2000", "2001", "2002"]'::jsonb,
          '["EF01MA01", "EF01MA02", "EF01MA03"]'::jsonb
        ),
        (
          'island-nature',
          'Ilha da Natureza',
          'Explore a natureza: plantas, animais e elementos do ambiente natural',
          'nature',
          5,
          '["3000", "3001", "3002"]'::jsonb,
          '["EF01MA01", "EF01MA02", "EF01MA06", "EF01MA08"]'::jsonb
        ),
        (
          'island-home',
          'Ilha da Casa',
          'Aprenda sobre os cômodos, objetos e rotinas da vida em casa',
          'home',
          6,
          '["4000", "4001", "4002"]'::jsonb,
          '["EF01MA01", "EF01MA03", "EF01MA06"]'::jsonb
        )
      ON CONFLICT ("islandId") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove islands 4-6
    await queryRunner.query(`
      DELETE FROM "islands"
      WHERE "islandId" IN ('island-body', 'island-nature', 'island-home')
    `);
  }
}
