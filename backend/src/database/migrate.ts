import { readFile } from 'fs/promises';
import { join } from 'path';
import { Client } from 'pg';

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required');

  let sql: string;
  try {
    sql = await readFile(join(__dirname, 'migrations', 'schema.sql'), 'utf8');
  } catch (error: any) {
    if (error?.code !== 'ENOENT') throw error;
    sql = await readFile(join(process.cwd(), 'src', 'database', 'migrations', 'schema.sql'), 'utf8');
  }
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    // PostgreSQL requires newly added enum labels to commit before a later
    // statement can use them in a CHECK constraint.
    await client.query(`
      DO $$
      DECLARE difficulty_type_name TEXT;
      DECLARE activity_type_name TEXT;
      DECLARE activity_type_value TEXT;
      BEGIN
        SELECT udt_name INTO activity_type_name FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'activities'
          AND column_name = 'type' AND data_type = 'USER-DEFINED';
        IF activity_type_name IS NOT NULL THEN
          FOREACH activity_type_value IN ARRAY ARRAY[
            'composition_decomposition', 'missing_number', 'pattern_completion',
            'representation_matching', 'error_detection', 'contextual_problem_solving'
          ] LOOP
            EXECUTE format('ALTER TYPE %I ADD VALUE IF NOT EXISTS %L', activity_type_name, activity_type_value);
          END LOOP;
        END IF;
        SELECT udt_name INTO difficulty_type_name FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'activities'
          AND column_name = 'difficulty' AND data_type = 'USER-DEFINED';
        IF difficulty_type_name IS NOT NULL THEN
          EXECUTE format('ALTER TYPE %I ADD VALUE IF NOT EXISTS %L', difficulty_type_name, 'very_easy');
          EXECUTE format('ALTER TYPE %I ADD VALUE IF NOT EXISTS %L', difficulty_type_name, 'extreme');
        END IF;
      END $$;
    `);
    await client.query(sql);
    console.log('Database schema is up to date');
  } finally {
    await client.end();
  }
}

migrate().catch((error) => {
  console.error('Database migration failed', error);
  process.exit(1);
});
