import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddActivityAgeAndTeaSupportColumns1728000102000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'activities',
      new TableColumn({
        name: 'target_year_min',
        type: 'int',
        isNullable: true,
        comment: 'Minimum school year (age group) for this activity',
      }),
    );

    await queryRunner.addColumn(
      'activities',
      new TableColumn({
        name: 'target_year_max',
        type: 'int',
        isNullable: true,
        comment: 'Maximum school year (age group) for this activity',
      }),
    );

    await queryRunner.addColumn(
      'activities',
      new TableColumn({
        name: 'tea_support_min',
        type: 'int',
        isNullable: true,
        comment: 'Minimum TEA support level required (1=low, 5=high)',
      }),
    );

    await queryRunner.addColumn(
      'activities',
      new TableColumn({
        name: 'tea_support_max',
        type: 'int',
        isNullable: true,
        comment: 'Maximum TEA support level (adaptive scaling)',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('activities', 'target_year_min');
    await queryRunner.dropColumn('activities', 'target_year_max');
    await queryRunner.dropColumn('activities', 'tea_support_min');
    await queryRunner.dropColumn('activities', 'tea_support_max');
  }
}
