import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: FixCycleTrackingIslandIdType
 *
 * `student_cycle_tracking.island_id` was created as `uuid`, but every place
 * that writes/reads it (CycleInitializationService, ActivitiesService,
 * CycleManagementService) always uses the string island slug (e.g.
 * 'island-numbers', 'island-sol'), matching `islands.island_id` and
 * `island_exercises_mapping.island_id`, which are both `varchar(50)`.
 *
 * Any attempt to use this table with a real island slug fails with:
 *   invalid input syntax for type uuid: "island-numbers"
 * (the exact same error class reported for the activities seed earlier in
 * this project). This had never surfaced because no cycle had ever been
 * successfully created. This migration aligns the column type so the
 * cycle-tracking feature can actually be used.
 */
export class FixCycleTrackingIslandIdType1728000104000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('student_cycle_tracking');
    if (!table) {
      // Table doesn't exist in this environment (e.g. fresh/partial schema); nothing to fix.
      return;
    }

    await queryRunner.query(
      `ALTER TABLE "student_cycle_tracking" ALTER COLUMN "island_id" TYPE varchar(50) USING "island_id"::text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('student_cycle_tracking');
    if (!table) {
      return;
    }

    // Only safe to revert if there is no non-UUID data (there shouldn't be,
    // since the uuid-typed column could never have accepted a slug).
    await queryRunner.query(
      `ALTER TABLE "student_cycle_tracking" ALTER COLUMN "island_id" TYPE uuid USING "island_id"::uuid`,
    );
  }
}
