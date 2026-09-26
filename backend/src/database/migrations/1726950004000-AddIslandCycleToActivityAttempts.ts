import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIslandCycleToActivityAttempts1726950004000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // [INTEGRATION 3C-FINAL]: Add island/cycle context for checkpoint scope validation
    await queryRunner.addColumn(
      'activity_attempts',
      new TableColumn({
        name: 'islandId',
        type: 'varchar',
        isNullable: true,
        comment: '[INTEGRATION 3C-FINAL]: Island context for checkpoint scope validation',
      }),
    );

    await queryRunner.addColumn(
      'activity_attempts',
      new TableColumn({
        name: 'cycleNumber',
        type: 'int',
        isNullable: true,
        comment: '[INTEGRATION 3C-FINAL]: Cycle number for checkpoint scope validation',
      }),
    );

    // Create index for efficient checkpoint scope queries
    await queryRunner.query(
      `CREATE INDEX idx_activity_attempts_island_cycle ON activity_attempts(islandId, cycleNumber)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX idx_activity_attempts_island_cycle`);
    await queryRunner.dropColumn('activity_attempts', 'cycleNumber');
    await queryRunner.dropColumn('activity_attempts', 'islandId');
  }
}
