import { BnccSkillsSeed } from './bncc-skills.seed';
import { ActivitiesSeed } from './activities.seed';
import * as dotenv from 'dotenv';
import { AppDataSource } from '../data-source';

dotenv.config();

async function runSeeds() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    console.log('🌱 Running seeds...');
    await BnccSkillsSeed(AppDataSource);
    await ActivitiesSeed(AppDataSource);
    console.log('✅ All seeds completed successfully!');
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

runSeeds();
