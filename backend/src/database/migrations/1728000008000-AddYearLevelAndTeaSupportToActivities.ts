import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddYearLevelAndTeaSupportToActivities1728000008000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add year level targeting metadata
    await queryRunner.addColumn(
      'activities',
      new TableColumn({
        name: 'target_year_min',
        type: 'int',
        isNullable: true,
        comment: 'Minimum school year this activity targets (1, 2, 3, etc)',
      }),
    );

    await queryRunner.addColumn(
      'activities',
      new TableColumn({
        name: 'target_year_max',
        type: 'int',
        isNullable: true,
        comment: 'Maximum school year this activity targets',
      }),
    );

    // Add TEA support level metadata
    await queryRunner.addColumn(
      'activities',
      new TableColumn({
        name: 'tea_support_min',
        type: 'int',
        isNullable: true,
        comment: 'Minimum TEA support level (1-5)',
      }),
    );

    await queryRunner.addColumn(
      'activities',
      new TableColumn({
        name: 'tea_support_max',
        type: 'int',
        isNullable: true,
        comment: 'Maximum TEA support level (1-5)',
      }),
    );

    // NOTE: the original version of this migration backfilled defaults with
    // `WHERE id LIKE 'ex-%'`, assuming slug-style text primary keys. The
    // `activities.id` column is `uuid` (see activity.entity.ts), so `LIKE`
    // against it throws "operator does not exist: uuid ~~ unknown" and would
    // abort this migration (and the whole `npm start` boot sequence) before
    // it could even register itself as executed. Backfill by BNCC skill
    // instead, which works regardless of the primary key format.
    // EF01MA03 (Comparison) exercises: Year 1-2, TEA support 1-4
    await queryRunner.query(`
      UPDATE activities 
      SET target_year_min = 1, target_year_max = 2, tea_support_min = 1, tea_support_max = 4
      WHERE bncc_skills @> '"EF01MA03"' AND target_year_min IS NULL
    `);

    // EF01MA04 (Counting to 100): Year 2-3, TEA support 2-4
    await queryRunner.query(`
      UPDATE activities 
      SET target_year_min = 2, target_year_max = 3, tea_support_min = 2, tea_support_max = 4
      WHERE bncc_skills @> '"EF01MA04"' AND target_year_min IS NULL
    `);

    // EF01MA05 (Two-digit ordering): Year 2-3, TEA support 2-4
    await queryRunner.query(`
      UPDATE activities 
      SET target_year_min = 2, target_year_max = 3, tea_support_min = 2, tea_support_max = 4
      WHERE bncc_skills @> '"EF01MA05"' AND target_year_min IS NULL
    `);

    // EF01MA02 (Counting strategies): Year 1-2, TEA support 2-4
    await queryRunner.query(`
      UPDATE activities 
      SET target_year_min = 1, target_year_max = 2, tea_support_min = 2, tea_support_max = 4
      WHERE bncc_skills @> '"EF01MA02"' AND target_year_min IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('activities', 'target_year_min');
    await queryRunner.dropColumn('activities', 'target_year_max');
    await queryRunner.dropColumn('activities', 'tea_support_min');
    await queryRunner.dropColumn('activities', 'tea_support_max');
  }
}
