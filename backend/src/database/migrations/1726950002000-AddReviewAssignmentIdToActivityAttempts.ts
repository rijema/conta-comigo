import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddReviewAssignmentIdToActivityAttempts1726950002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'activity_attempts',
      new TableColumn({
        name: 'reviewAssignmentId',
        type: 'uuid',
        isNullable: true,
        comment: '[INTEGRATION 3B.2]: Links attempt to review assignment for longitudinal tracking',
      }),
    );

    // Create index for efficient lookup
    await queryRunner.query(
      `CREATE INDEX idx_activity_attempts_review_assignment_id ON activity_attempts(reviewAssignmentId)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX idx_activity_attempts_review_assignment_id`);
    await queryRunner.dropColumn('activity_attempts', 'reviewAssignmentId');
  }
}
