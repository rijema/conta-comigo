import * as dotenv from 'dotenv';
import { join } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';

dotenv.config();

function buildDataSourceOptions(): DataSourceOptions {
  const databaseUrl = process.env.DATABASE_URL;
  const isCompiledRuntime = __dirname.includes(`${join('dist', 'database')}`);
  const baseDir = isCompiledRuntime ? __dirname : join(process.cwd(), 'src', 'database');
  const entitiesGlob = isCompiledRuntime
    ? join(__dirname, '../**/*.entity.js')
    : join(process.cwd(), 'src', '**/*.entity.ts');
  const migrationsGlob = join(baseDir, 'migrations', isCompiledRuntime ? '*.js' : '*.ts');

  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      entities: [entitiesGlob],
      migrations: [migrationsGlob],
      migrationsTableName: 'typeorm_migrations',
      synchronize: false,
      logging: false,
    };
  }

  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'contacomigo',
    entities: [entitiesGlob],
    migrations: [migrationsGlob],
    migrationsTableName: 'typeorm_migrations',
    synchronize: false,
    logging: false,
  };
}

export const appDataSourceOptions = buildDataSourceOptions();
export const AppDataSource = new DataSource(appDataSourceOptions);

export function getPendingMigrationClasses() {
  // Order matters: establish baseline/alignment before exposing legacy migrations
  // to TypeORM's executor on existing environments.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { BaselineProductionSchema1728000000000 } = require('./migrations/1728000000000-BaselineProductionSchema');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { AlignProductionSchemaWithMigrations1728000001000 } = require('./migrations/1728000001000-AlignProductionSchemaWithMigrations');

  return [
    BaselineProductionSchema1728000000000,
    AlignProductionSchemaWithMigrations1728000001000,
  ];
}
