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
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { AddRemainingIslands1728000002000 } = require('./migrations/1728000002000-AddRemainingIslands');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { UpdateIslandsWithCompleteSkills1728000003000 } = require('./migrations/1728000003000-UpdateIslandsWithCompleteSkills');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { AddIsNewColumnToActivities1728000005000 } = require('./migrations/1728000005000-AddIsNewColumnToActivities');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { AddExerciseParametersAndCycleTracking1728000006000 } = require('./migrations/1728000006000-AddExerciseParametersAndCycleTracking');
  // NOTE: 1728000007000-SeedExerciseParameters and 1728000008000-AddYearLevelAndTeaSupportToActivities
  // are intentionally NOT included here:
  //  - 007 inserts legacy slug-style activity_id values (e.g. 'ex-1-comparison-blocks')
  //    into exercise_parameters.activity_id, which is a `uuid` column — this INSERT
  //    would throw "invalid input syntax for type uuid" and crash `npm start` on deploy.
  //  - 008 adds target_year_min/target_year_max/tea_support_min/tea_support_max to
  //    `activities`, but those same columns are already added by
  //    AddActivityAgeAndTeaSupportColumns1728000102000 below (which already ran in
  //    production) — re-running 008 would crash with "column already exists".
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { ReorganizeExercisesIntoCycles1728000100000 } = require('./migrations/1728000100000-ReorganizeExercisesIntoCycles');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { AddActivityAgeAndTeaSupportColumns1728000102000 } = require('./migrations/1728000102000-AddActivityAgeAndTeaSupportColumns');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { CleanupCorruptedActivityUuids1728000103000 } = require('./migrations/1728000103000-CleanupCorruptedActivityUuids');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { FixCycleTrackingIslandIdType1728000104000 } = require('./migrations/1728000104000-FixCycleTrackingIslandIdType');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { AddRegistrationNonceToUsers1729000000000 } = require('./migrations/1729000000000-AddRegistrationNonceToUsers');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { AddPauseEventTypes1729000001000 } = require('./migrations/1729000001000-AddPauseEventTypes');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { AddAttendances1728100000000 } = require('./migrations/1728100000000-AddAttendances');

  return [
    BaselineProductionSchema1728000000000,
    AlignProductionSchemaWithMigrations1728000001000,
    // The following 6 migrations existed on disk since late 1728000xxx commits
    // but were never added to this hardcoded list — the ONLY migration runner
    // actually executed by `npm start` in production (see run-migrations.ts).
    // They silently never ran. In particular, 006 (exercise_parameters /
    // student_cycle_tracking tables) is required by CycleManagementService,
    // which has been dead-on-arrival in production ("relation
    // exercise_parameters does not exist") since whenever that service was
    // first deployed.
    AddRemainingIslands1728000002000,
    UpdateIslandsWithCompleteSkills1728000003000,
    AddIsNewColumnToActivities1728000005000,
    AddExerciseParametersAndCycleTracking1728000006000,
    ReorganizeExercisesIntoCycles1728000100000,
    AddActivityAgeAndTeaSupportColumns1728000102000,
    CleanupCorruptedActivityUuids1728000103000,
    FixCycleTrackingIslandIdType1728000104000,
    // Registration idempotency column (backend/auth.service.ts findByRegistrationNonce)
    // was added to the User entity but this list — the ONLY migration runner
    // actually executed on `npm start` in production — was never updated to
    // include it. The column never existed in prod, so every TypeORM query
    // that selects the User entity (including login) failed with
    // "column user.registration_nonce does not exist".
    AddRegistrationNonceToUsers1729000000000,
    // Calm-break learning events (PAUSE_SUGGESTED / PAUSE_STARTED / PAUSE_ENDED).
    AddPauseEventTypes1729000001000,
    // Professional attendance flow (start/resume/end without learner login).
    AddAttendances1728100000000,
  ];
}
