import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddExerciseParametersAndCycleTracking1728000006000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create exercise_parameters table
    await queryRunner.createTable(
      new Table({
        name: 'exercise_parameters',
        columns: [
          new TableColumn({
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          }),
          new TableColumn({
            name: 'activity_id',
            type: 'uuid',
            isUnique: true,
            comment: 'Foreign key to activities table',
          }),
          new TableColumn({
            name: 'primary_skill',
            type: 'varchar',
            isNullable: true,
            comment: 'e.g., EF01MA03',
          }),
          new TableColumn({
            name: 'secondary_skills',
            type: 'text',
            isNullable: true,
            comment: 'Comma-separated, e.g., EF01MA06,EF01MA14',
          }),
          new TableColumn({
            name: 'target_year_min',
            type: 'int',
            isNullable: true,
            comment: 'Minimum year this exercise targets (1, 2, 3, etc)',
          }),
          new TableColumn({
            name: 'target_year_max',
            type: 'int',
            isNullable: true,
            comment: 'Maximum year this exercise targets',
          }),
          new TableColumn({
            name: 'optimal_year',
            type: 'int',
            isNullable: true,
            comment: 'Sweet spot year for this exercise',
          }),
          new TableColumn({
            name: 'tea_support_min',
            type: 'int',
            isNullable: true,
            comment: 'Minimum TEA support level (1-5)',
          }),
          new TableColumn({
            name: 'tea_support_max',
            type: 'int',
            isNullable: true,
            comment: 'Maximum TEA support level (1-5)',
          }),
          new TableColumn({
            name: 'optimal_tea_support',
            type: 'int',
            isNullable: true,
            comment: 'Optimal TEA support level for this exercise',
          }),
          new TableColumn({
            name: 'visual_intensity',
            type: 'decimal',
            precision: 3,
            scale: 1,
            default: 3.0,
            comment: '0.0-5.0: how much visual content',
          }),
          new TableColumn({
            name: 'auditory_intensity',
            type: 'decimal',
            precision: 3,
            scale: 1,
            default: 2.0,
            comment: '0.0-5.0: how much audio',
          }),
          new TableColumn({
            name: 'kinesthetic_intensity',
            type: 'decimal',
            precision: 3,
            scale: 1,
            default: 3.5,
            comment: '0.0-5.0: how much touch/interaction',
          }),
          new TableColumn({
            name: 'complexity_score',
            type: 'int',
            default: 50,
            comment: '1-100: cognitive load',
          }),
          new TableColumn({
            name: 'time_limit_seconds',
            type: 'int',
            isNullable: true,
            comment: 'Expected time to complete',
          }),
          new TableColumn({
            name: 'scaffolding_level',
            type: 'varchar',
            default: "'medium'",
            comment: "high, medium, low",
          }),
          new TableColumn({
            name: 'exercise_type',
            type: 'varchar',
            default: "'minigame'",
            comment: "minigame, drag_drop, multiple_choice, free_response",
          }),
          new TableColumn({
            name: 'minigame_name',
            type: 'varchar',
            isNullable: true,
            comment: 'If exercise_type=minigame, which minigame component',
          }),
          new TableColumn({
            name: 'engagement_score',
            type: 'decimal',
            precision: 3,
            scale: 2,
            default: 0.7,
            comment: '0.00-1.00 based on user feedback',
          }),
          new TableColumn({
            name: 'success_rate',
            type: 'decimal',
            precision: 3,
            scale: 2,
            default: 0.65,
            comment: '0.00-1.00 average success rate',
          }),
          new TableColumn({
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          }),
          new TableColumn({
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          }),
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['activity_id'],
            referencedTableName: 'activities',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
        indices: [
          new TableIndex({ columnNames: ['activity_id'] }),
          new TableIndex({ columnNames: ['primary_skill'] }),
          new TableIndex({ columnNames: ['optimal_year'] }),
        ],
      }),
    );

    // 2. Create student_cycle_tracking table
    await queryRunner.createTable(
      new Table({
        name: 'student_cycle_tracking',
        columns: [
          new TableColumn({
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          }),
          new TableColumn({
            name: 'student_id',
            type: 'uuid',
            comment: 'Foreign key to students/users',
          }),
          new TableColumn({
            name: 'island_id',
            type: 'uuid',
            comment: 'Which island this cycle belongs to',
          }),
          new TableColumn({
            name: 'cycle_number',
            type: 'int',
            comment: 'Cycle 1, 2, 3, etc within this island',
          }),
          new TableColumn({
            name: 'skill_focus',
            type: 'varchar',
            comment: 'Primary BNCC skill for this cycle (e.g., EF01MA03)',
          }),
          new TableColumn({
            name: 'current_position',
            type: 'int',
            default: 1,
            comment: 'Which exercise position (1-10)',
          }),
          new TableColumn({
            name: 'status',
            type: 'varchar',
            default: "'active'",
            comment: "active, completed, paused, abandoned",
          }),
          new TableColumn({
            name: 'exercises_completed_count',
            type: 'int',
            default: 0,
          }),
          new TableColumn({
            name: 'total_exercises',
            type: 'int',
            default: 10,
          }),
          new TableColumn({
            name: 'started_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          }),
          new TableColumn({
            name: 'completed_at',
            type: 'timestamp',
            isNullable: true,
          }),
          new TableColumn({
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          }),
          new TableColumn({
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          }),
        ],
        indices: [
          new TableIndex({ columnNames: ['student_id', 'island_id', 'cycle_number'], isUnique: true }),
          new TableIndex({ columnNames: ['student_id', 'status'] }),
        ],
      }),
    );

    // 3. Create cycle_exercise_assignment table (tracks which exercises in which positions)
    await queryRunner.createTable(
      new Table({
        name: 'cycle_exercise_assignment',
        columns: [
          new TableColumn({
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          }),
          new TableColumn({
            name: 'cycle_tracking_id',
            type: 'uuid',
            comment: 'Foreign key to student_cycle_tracking',
          }),
          new TableColumn({
            name: 'activity_id',
            type: 'uuid',
            comment: 'Which activity is assigned',
          }),
          new TableColumn({
            name: 'position_in_cycle',
            type: 'int',
            comment: '1-10 position',
          }),
          new TableColumn({
            name: 'match_score',
            type: 'decimal',
            precision: 4,
            scale: 3,
            isNullable: true,
            comment: '0.000-1.000 matching score',
          }),
          new TableColumn({
            name: 'is_completed',
            type: 'boolean',
            default: false,
          }),
          new TableColumn({
            name: 'student_score',
            type: 'decimal',
            precision: 3,
            scale: 2,
            isNullable: true,
            comment: '0.00-1.00 student performance',
          }),
          new TableColumn({
            name: 'completed_at',
            type: 'timestamp',
            isNullable: true,
          }),
          new TableColumn({
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          }),
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['cycle_tracking_id'],
            referencedTableName: 'student_cycle_tracking',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
          new TableForeignKey({
            columnNames: ['activity_id'],
            referencedTableName: 'activities',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
        indices: [
          new TableIndex({ columnNames: ['cycle_tracking_id', 'position_in_cycle'] }),
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('cycle_exercise_assignment', true);
    await queryRunner.dropTable('student_cycle_tracking', true);
    await queryRunner.dropTable('exercise_parameters', true);
  }
}
