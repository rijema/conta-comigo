import { AppDataSource, getPendingMigrationClasses } from './data-source';

function isTableAlreadyPresentError(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && (error as { code?: string }).code === '42P07';
}

async function registerMigrationInHistory(
  queryRunner: any,
  migrationName: string,
): Promise<void> {
  const timestamp = new Date().getTime();
  await queryRunner.query(
    `INSERT INTO "typeorm_migrations" ("timestamp", "name") VALUES ($1, $2)`,
    [timestamp, migrationName],
  );
}

async function runMigrations() {
  try {
    await AppDataSource.initialize();
    const queryRunner = AppDataSource.createQueryRunner();
    
    // Check if typeorm_migrations table exists
    const executed = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'typeorm_migrations'
      ) AS "exists"
    `);
    const hasHistory = Boolean(executed[0]?.exists);
    
    if (!hasHistory) {
      console.log('Creating typeorm_migrations table...');
      // Create the migrations history table
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "typeorm_migrations" (
          "id" SERIAL PRIMARY KEY,
          "timestamp" BIGINT NOT NULL,
          "name" VARCHAR NOT NULL UNIQUE
        )
      `);
    }

    // Get all pending migrations
    const pendingMigrations = getPendingMigrationClasses();
    
    if (pendingMigrations.length > 0) {
      console.log(`Found ${pendingMigrations.length} migration(s) to execute`);
      
      for (const MigrationClass of pendingMigrations) {
        const migration = new MigrationClass();
        const migrationName = migration.constructor.name;
        
        // Check if migration was already executed
        const alreadyRun = await queryRunner.query(
          `SELECT 1 FROM "typeorm_migrations" WHERE "name" = $1`,
          [migrationName],
        );
        
        if (alreadyRun.length > 0) {
          console.log(`⏭️  Skipping ${migrationName} (already executed)`);
          continue;
        }
        
        const migrationRunner = AppDataSource.createQueryRunner();
        try {
          console.log(`🔄 Executing ${migrationName}...`);
          await migrationRunner.connect();
          await migration.up(migrationRunner);
          
          // Register in history
          await registerMigrationInHistory(migrationRunner, migrationName);
          console.log(`✅ ${migrationName} completed`);
        } catch (error) {
          if (!isTableAlreadyPresentError(error)) {
            console.error(`❌ ${migrationName} failed:`, error);
            throw error;
          }
          console.log(`⚠️  ${migrationName} - table already exists (skipping)`);
          // Still register it as executed
          await registerMigrationInHistory(migrationRunner, migrationName);
        } finally {
          await migrationRunner.release();
        }
      }
    }

    const migrationHistory = await queryRunner.query(
      'SELECT COUNT(*)::int AS count FROM "typeorm_migrations"',
    );
    const executedCount = migrationHistory[0]?.count || 0;
    
    console.log(`\n✨ Migration complete! ${executedCount} migration(s) in history`);
    
    await queryRunner.release();
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

runMigrations().catch((error) => {
  console.error('Database migration failed', error);
  process.exit(1);
});
