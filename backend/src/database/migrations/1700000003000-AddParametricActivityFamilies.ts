import { MigrationInterface, QueryRunner } from 'typeorm';

const NEW_ACTIVITY_TYPES = [
  'composition_decomposition',
  'missing_number',
  'pattern_completion',
  'representation_matching',
  'error_detection',
  'contextual_problem_solving',
] as const;

const ALL_ACTIVITY_TYPES = [
  'visual_puzzle',
  'quiz',
  'video_question',
  'yes_no',
  'counting',
  'drag_drop',
  ...NEW_ACTIVITY_TYPES,
] as const;

export class AddParametricActivityFamilies1700000003000
implements MigrationInterface {
  name = 'AddParametricActivityFamilies1700000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const [column] = await queryRunner.query(`
      SELECT data_type, udt_name
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'activities'
        AND column_name = 'type'
    `) as Array<{ data_type: string; udt_name: string }>;

    if (column?.data_type === 'USER-DEFINED') {
      for (const activityType of NEW_ACTIVITY_TYPES) {
        await queryRunner.query(
          `ALTER TYPE "${column.udt_name}" ADD VALUE IF NOT EXISTS '${activityType}'`,
        );
      }
      return;
    }

    await queryRunner.query(
      'ALTER TABLE "activities" DROP CONSTRAINT IF EXISTS "activities_type_check"',
    );
    await queryRunner.query(`
      ALTER TABLE "activities"
      ADD CONSTRAINT "activities_type_check"
      CHECK ("type" IN (${ALL_ACTIVITY_TYPES.map((value) => `'${value}'`).join(', ')}))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const [{ count }] = await queryRunner.query(`
      SELECT COUNT(*)::int AS count
      FROM "activities"
      WHERE "type" IN (${NEW_ACTIVITY_TYPES.map((value) => `'${value}'`).join(', ')})
    `) as Array<{ count: number }>;
    if (Number(count) > 0) {
      throw new Error(
        'Cannot remove parametric activity types while activities still use them',
      );
    }

    // PostgreSQL enum values are intentionally retained on rollback. Removing
    // enum labels requires replacing the entire type and is not safely additive.
    await queryRunner.query(
      'ALTER TABLE "activities" DROP CONSTRAINT IF EXISTS "activities_type_check"',
    );
    await queryRunner.query(`
      ALTER TABLE "activities"
      ADD CONSTRAINT "activities_type_check"
      CHECK ("type" IN ('visual_puzzle', 'quiz', 'video_question', 'yes_no', 'counting', 'drag_drop'))
    `);
  }
}
