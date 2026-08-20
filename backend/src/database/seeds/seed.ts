import { DataSource } from 'typeorm';
import { BnccSkillsSeed } from './bncc-skills.seed';
import { ActivitiesSeed } from './activities.seed';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config();

async function runSeeds() {
  // Parse DATABASE_URL or use individual env vars
  const databaseUrl = process.env.DATABASE_URL;
  let dataSourceConfig: any;

  if (databaseUrl) {
    dataSourceConfig = {
      type: 'postgres',
      url: databaseUrl,
      entities: [join(__dirname, '../../**/*.entity.js')],
      synchronize: false,
      logging: false,
    };
  } else {
    dataSourceConfig = {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'mathasd',
      entities: [join(__dirname, '../../**/*.entity.js')],
      synchronize: false,
      logging: false,
    };
  }

  const dataSource = new DataSource(dataSourceConfig);

  try {
    await dataSource.initialize();
    console.log('✅ Database connected');

    console.log('🌱 Running seeds...');
    await BnccSkillsSeed(dataSource);
    await ActivitiesSeed(dataSource);
    console.log('✅ All seeds completed successfully!');

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

runSeeds();
