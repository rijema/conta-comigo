import { AppDataSource } from './data-source';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * [PROPOSTA CONTA COMIGO] Seed islands and map activities
 * 
 * This script populates the island_activity_mappings table
 * with the 30 activities (10 per island × 3 islands)
 */
async function seedIslands() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const queryRunner = AppDataSource.createQueryRunner();

    // Read and execute the island mapping SQL
    const fs = require('fs');
    const path = require('path');
    // Try both dist and src paths
    let sqlPath = path.join(__dirname, 'seeds', 'map-activities-to-islands.sql');
    if (!fs.existsSync(sqlPath)) {
      sqlPath = path.join(__dirname, '..', '..', 'src', 'database', 'seeds', 'map-activities-to-islands.sql');
    }
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('🌱 Seeding island activity mappings...');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter((s: string) => s.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await queryRunner.query(statement);
        } catch (err: any) {
          // Ignore "ON CONFLICT" errors - they mean the mapping already exists
          if (!err.message.includes('duplicate key')) {
            console.warn(`⚠️  Statement error (may be expected):`, err.message.split('\n')[0]);
          }
        }
      }
    }

    // Verify the mappings
    const result = await queryRunner.query(`
      SELECT 
        i."islandId",
        i.name,
        i."sequenceOrder",
        COUNT(iam."activityId") as total_activities
      FROM islands i
      LEFT JOIN island_activity_mappings iam ON i."islandId" = iam."islandId" AND iam."isActive" = true
      GROUP BY i."islandId", i.name, i."sequenceOrder"
      ORDER BY i."sequenceOrder"
    `);

    console.log('\n📊 Island Activity Mappings:');
    for (const row of result) {
      console.log(`  ${row.name}: ${row.total_activities} activities`);
    }

    const totalMapped = result.reduce((sum: number, r: any) => sum + r.total_activities, 0);
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

seedIslands();
