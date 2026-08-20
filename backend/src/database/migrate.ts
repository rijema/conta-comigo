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
