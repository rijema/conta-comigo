import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIsNewFlagToActivities1728000004000 implements MigrationInterface {
  name = 'AddIsNewFlagToActivities1728000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('activities', 'isNew');
  }
}
