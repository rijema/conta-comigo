import { AppDataSource } from './data-source';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * [PROPOSTA CONTA COMIGO] Auto-seed islands with available activities
 * 
 * This script automatically maps the 173 available activities to islands
 * based on their BNCC skills and difficulty, ensuring 10 activities per island
 */
async function autoSeedIslands() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const queryRunner = AppDataSource.createQueryRunner();

    // Get all islands
    const islands = await queryRunner.query(`
      SELECT "islandId", "bnccSkills", "sequenceOrder"
      FROM islands
      ORDER BY "sequenceOrder"
    `);

    console.log(`\n🌱 Found ${islands.length} islands`);

    for (const island of islands) {
      const bnccSkills = island.bnccSkills || [];
      console.log(`\n📍 Processing ${island.islandId} (BNCC: ${bnccSkills.join(', ')})`);

      // Get activities for this island's BNCC skills
      const activities = await queryRunner.query(`
        SELECT id, title, difficulty, type
        FROM activities
        WHERE "isActive" = true
          AND ("bnccSkills" @> $1::jsonb OR "bnccSkills" @> $2::jsonb OR "bnccSkills" @> $3::jsonb OR "bnccSkills" @> $4::jsonb OR "bnccSkills" @> $5::jsonb)
        ORDER BY difficulty ASC, RANDOM()
        LIMIT 10
      `,
      [
        JSON.stringify([bnccSkills[0]]),
        JSON.stringify([bnccSkills[1]]),
        JSON.stringify([bnccSkills[2]]),
        JSON.stringify([bnccSkills[3]]),
        JSON.stringify([bnccSkills[4]]),
      ]);

      console.log(`  Found ${activities.length} activities`);

      // Map activities to sequences
      let sequence = 1;
      for (const activity of activities) {
        const modality = ['visual', 'auditory', 'cognitive', 'sensory'][sequence % 4];
        
        await queryRunner.query(`
          INSERT INTO island_activity_mappings ("islandId", "activityId", "sequenceInIsland", "difficulty", "modality", "isActive", "createdAt")
          VALUES ($1, $2, $3, $4, $5, true, NOW())
          ON CONFLICT ("islandId", "activityId") DO NOTHING
        `,
        [island.islandId, activity.id, sequence, activity.difficulty, modality]);

        console.log(`    ✓ Seq ${sequence}: ${activity.title.substring(0, 40)}...`);
        sequence++;
      }
    }

    // Verify the mappings
    const result = await queryRunner.query(`
      SELECT 
        i."islandId",
        i.name,
        COUNT(iam."activityId") as total_activities
      FROM islands i
      LEFT JOIN island_activity_mappings iam ON i."islandId" = iam."islandId" AND iam."isActive" = true
      GROUP BY i."islandId", i.name, i."sequenceOrder"
      ORDER BY i."sequenceOrder"
    `);

    console.log('\n\n📊 Final Island Activity Mappings:');
    let totalMapped = 0;
    for (const row of result) {
      console.log(`  ${row.name}: ${row.total_activities} activities`);
      totalMapped += row.total_activities;
    }
    console.log(`\n✅ Total activities mapped: ${totalMapped}`);

    await queryRunner.release();
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

autoSeedIslands();
