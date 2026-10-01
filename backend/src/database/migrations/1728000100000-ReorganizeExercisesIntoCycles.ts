/**
 * Migration: ReorganizeExercisesIntoCycles
 *
 * Analyzes existing exercises and groups them by BNCC skill.
 * This prepares the data model for cycle-based learning but doesn't create student cycles yet.
 * Cycles are auto-initialized per student on first island access via CycleInitializationService.
 *
 * Scientific basis (Vygotsky, Sweller, Baron-Cohen):
 * - Skill focus reduces context-switching overhead
 * - Fixed cycle size (10) provides predictability for autism spectrum learners
 * - Progression based on performance (not position) maintains Vygotsky ZPD
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReorganizeExercisesIntoCycles1728000100000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Analyze exercises and log grouping (informational only)
    const result = await queryRunner.query(`
      SELECT 
        unnest(bncc_skills) as skill,
        COUNT(*) as count,
        difficulty,
        COUNT(*) FILTER (WHERE difficulty = 'very_easy') as very_easy_count,
        COUNT(*) FILTER (WHERE difficulty = 'easy') as easy_count,
        COUNT(*) FILTER (WHERE difficulty = 'medium') as medium_count,
        COUNT(*) FILTER (WHERE difficulty = 'hard') as hard_count,
        COUNT(*) FILTER (WHERE difficulty = 'very_hard') as very_hard_count
      FROM activities
      WHERE is_active = true
      GROUP BY unnest(bncc_skills), difficulty
      ORDER BY skill, difficulty
    `);

    console.log('[Migration] Exercise distribution by BNCC skill:');
    const skillGroups = new Map<string, any[]>();
    result.forEach((row: any) => {
      if (!skillGroups.has(row.skill)) {
        skillGroups.set(row.skill, []);
      }
      skillGroups.get(row.skill)?.push({
        difficulty: row.difficulty,
        count: row.count,
      });
    });

    let totalExercises = 0;
    for (const [skill, difficulties] of skillGroups.entries()) {
      const subtotal = difficulties.reduce((sum, d) => sum + d.count, 0);
      totalExercises += subtotal;
      console.log(
        `  ${skill}: ${subtotal} exercises (${difficulties.map((d) => `${d.difficulty}: ${d.count}`).join(', ')})`,
      );
    }

    console.log(
      `[Migration] Total: ${totalExercises} exercises across ${skillGroups.size} skills`,
    );
    console.log(
      `[Migration] Cycles will be auto-created per student on island access`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This migration is informational only; no schema changes to rollback
    console.log('[Migration] Rollback: No schema changes made');
  }
}
