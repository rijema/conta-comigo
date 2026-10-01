import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIsNewColumnToActivities1728000005000 implements MigrationInterface {
  name = 'AddIsNewColumnToActivities1728000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('activities', 'isNew');
    
    if (!hasColumn) {
      await queryRunner.addColumn(
        'activities',
        new TableColumn({
          name: 'isNew',
          type: 'boolean',
          isNullable: false,
          default: false,
          comment: 'Marks new activities for UI highlighting and review workflows',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('activities', 'isNew');
  }
}
