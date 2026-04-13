import { DataSource } from 'typeorm';
import { BnccSkillsSeed } from './bncc-skills.seed';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'mathasd_user',
  password: process.env.DATABASE_PASSWORD || 'mathasd_pass',
  database: process.env.DATABASE_NAME || 'mathasd',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging: false,
});

async function runSeeds() {
  try {
    await AppDataSource.initialize();
    console.log('📊 Database connected');

    console.log('🌱 Running seeds...');
    await BnccSkillsSeed(AppDataSource);

    console.log('✅ All seeds completed!');
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

runSeeds();
