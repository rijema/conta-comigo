import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddReviewOutcomes1726950001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for progression_classification
    await queryRunner.query(`
      CREATE TYPE progression_classification_enum AS ENUM ('IMPROVED', 'STABLE', 'NEEDS_SUPPORT', 'INCONCLUSIVE');
    `);

    await queryRunner.createTable(
      new Table({
        name: 'review_outcomes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'reviewAssignmentId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'studentId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'skillId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'reviewInteractionId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'reviewRecommendationId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'baselineMetrics',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'reviewMetrics',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'deltas',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'normalizedDeltas',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'progressionClassification',
            type: 'progression_classification_enum',
            isNullable: false,
          },
          {
            name: 'evidenceSignals',
            type: 'varchar[]',
            isNullable: false,
            default: "'{}'",
          },
          {
            name: 'classificationReason',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      'review_outcomes',
      new TableIndex({
        columnNames: ['reviewAssignmentId'],
      }),
    );

    await queryRunner.createIndex(
      'review_outcomes',
      new TableIndex({
        columnNames: ['studentId', 'skillId', 'createdAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('review_outcomes');
    await queryRunner.query(`DROP TYPE progression_classification_enum;`);
  }
}
