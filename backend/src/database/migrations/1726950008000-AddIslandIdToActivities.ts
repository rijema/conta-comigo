import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

/**
 * [PROPOSTA CONTA COMIGO] Add island context to activities
 * 
 * Adds islandId column to activities table to enable:
 * - Direct island filtering during activity selection
 * - Island-aware cooldown/diversity algorithm
 * - Faster queries without joining island_activity_mappings
 */
export class AddIslandIdToActivities1726950008000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'activities',
      new TableColumn({
        name: 'islandId',
        type: 'varchar',
        isNullable: true,
        comment: 'Island this activity belongs to (denormalized from island_activity_mappings for performance)',
      }),
    );

    // Create index for faster island-based filtering
    await queryRunner.query(
      `CREATE INDEX idx_activities_island_id ON activities(islandId)`,
    );

    // Populate islandId from island_activity_mappings
    // For each activity, find its island from the mapping table
    await queryRunner.query(`
      UPDATE activities a
      SET islandId = (
        SELECT islandId FROM island_activity_mappings iam
        WHERE iam.activityId = a.id AND iam.isActive = true
        LIMIT 1
      )
      WHERE EXISTS (
        SELECT 1 FROM island_activity_mappings iam
        WHERE iam.activityId = a.id AND iam.isActive = true
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_activities_island_id`);
    await queryRunner.dropColumn('activities', 'islandId');
  }
}
