import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddReviewAssignments1726950000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for review_type
    await queryRunner.query(`
      CREATE TYPE review_type_enum AS ENUM ('REMEDIATION', 'RETENTION', 'GENERALIZATION');
    `);

    await queryRunner.createTable(
      new Table({
        name: 'review_assignments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
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
            name: 'reviewType',
            type: 'review_type_enum',
            isNullable: false,
          },
          {
            name: 'sourceInteractionIds',
            type: 'uuid[]',
            isNullable: false,
            default: "'{}'",
          },
          {
            name: 'sourceRecommendationIds',
            type: 'uuid[]',
            isNullable: false,
            default: "'{}'",
          },
          {
            name: 'selectedActivityTemplateId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'selectedActivityInstanceId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'reason',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'priorityScore',
            type: 'float',
            isNullable: false,
          },
          {
            name: 'scoringConfiguration',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'scoringBreakdown',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'baselineState',
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
          {
            name: 'completedAt',
            type: 'timestamptz',
            isNullable: true,
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      'review_assignments',
      new TableIndex({
        columnNames: ['studentId', 'skillId', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'review_assignments',
      new TableIndex({
        columnNames: ['studentId', 'createdAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('review_assignments');
    await queryRunner.query(`DROP TYPE review_type_enum;`);
  }
}
