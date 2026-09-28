import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * [PROPOSTA CONTA COMIGO] Update islands with complete BNCC skill coverage
 * 
 * Redistribute BNCC skills across 6 islands to cover all available skills
 * and ensure proper progression across years (EF01-EF05)
 */
export class UpdateIslandsWithCompleteSkills1728000003000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update islands with comprehensive BNCC skill mapping
    await queryRunner.query(`
      UPDATE "islands" SET "bnccSkills" = $1
      WHERE "islandId" = 'island-numbers'
    `, [JSON.stringify(["EF01MA01", "EF01MA02", "EF01MA06", "EF01MA07", "EF01MA08", "EF02MA01", "EF02MA05"])]);

    await queryRunner.query(`
      UPDATE "islands" SET "bnccSkills" = $1
      WHERE "islandId" = 'island-colors'
    `, [JSON.stringify(["EF01MA03", "EF01MA14", "EF02MA14", "EF03MA15"])]);

    await queryRunner.query(`
      UPDATE "islands" SET "bnccSkills" = $1
      WHERE "islandId" = 'island-beach'
    `, [JSON.stringify(["EF01MA01", "EF01MA02", "EF01MA03", "EF01MA13", "EF02MA01"])]);

    await queryRunner.query(`
      UPDATE "islands" SET "bnccSkills" = $1
      WHERE "islandId" = 'island-body'
    `, [JSON.stringify(["EF02MA07", "EF03MA01", "EF03MA07", "EF03MA08"])]);

    await queryRunner.query(`
      UPDATE "islands" SET "bnccSkills" = $1
      WHERE "islandId" = 'island-nature'
    `, [JSON.stringify(["EF01MA06", "EF02MA05", "EF03MA07", "EF04MA06"])]);

    await queryRunner.query(`
      UPDATE "islands" SET "bnccSkills" = $1
      WHERE "islandId" = 'island-home'
    `, [JSON.stringify(["EF04MA01", "EF04MA09", "EF05MA01", "EF05MA06"])]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert to original skills
    await queryRunner.query(`
      UPDATE "islands" SET "bnccSkills" = $1
      WHERE "islandId" = 'island-numbers'
    `, [JSON.stringify(["EF01MA01", "EF01MA02", "EF01MA03", "EF01MA06", "EF01MA08"])]);

    await queryRunner.query(`
      UPDATE "islands" SET "bnccSkills" = $1
      WHERE "islandId" = 'island-colors'
    `, [JSON.stringify(["EF01MA14", "EF01MA03"])]);

    await queryRunner.query(`
      UPDATE "islands" SET "bnccSkills" = $1
      WHERE "islandId" = 'island-beach'
    `, [JSON.stringify(["EF01MA01", "EF01MA02", "EF01MA03", "EF01MA06"])]);

    await queryRunner.query(`
      UPDATE "islands" SET "bnccSkills" = $1
      WHERE "islandId" = 'island-body'
    `, [JSON.stringify(["EF01MA01", "EF01MA02", "EF01MA03"])]);

    await queryRunner.query(`
      UPDATE "islands" SET "bnccSkills" = $1
      WHERE "islandId" = 'island-nature'
    `, [JSON.stringify(["EF01MA01", "EF01MA02", "EF01MA06", "EF01MA08"])]);

    await queryRunner.query(`
      UPDATE "islands" SET "bnccSkills" = $1
      WHERE "islandId" = 'island-home'
    `, [JSON.stringify(["EF01MA01", "EF01MA03", "EF01MA06"])]);
  }
}
