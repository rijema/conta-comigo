import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCheckpointContextToReviewAssignments1726950005000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // [INTEGRATION 3C-FINAL]: Add checkpoint/retention context to prevent duplicate triggers
    await queryRunner.addColumn(
      'review_assignments',
      new TableColumn({
        name: 'triggerType',
        type: 'varchar',
        isNullable: true,
        comment: '[INTEGRATION 3C-FINAL]: Type of trigger (CHECKPOINT or RETENTION)',
      }),
    );

    await queryRunner.addColumn(
      'review_assignments',
      new TableColumn({
        name: 'islandId',
        type: 'varchar',
        isNullable: true,
        comment: '[INTEGRATION 3C-FINAL]: Island context for checkpoint scope',
      }),
    );

    await queryRunner.addColumn(
      'review_assignments',
      new TableColumn({
        name: 'cycleNumber',
        type: 'int',
        isNullable: true,
        comment: '[INTEGRATION 3C-FINAL]: Cycle number for checkpoint scope (prevents duplicate triggers)',
      }),
    );

    // Create index for efficient checkpoint deduplication queries
    await queryRunner.query(
      `CREATE INDEX idx_review_assignments_checkpoint_scope ON review_assignments(studentId, triggerType, islandId, cycleNumber)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX idx_review_assignments_checkpoint_scope`);
    await queryRunner.dropColumn('review_assignments', 'cycleNumber');
    await queryRunner.dropColumn('review_assignments', 'islandId');
    await queryRunner.dropColumn('review_assignments', 'triggerType');
  }
}
