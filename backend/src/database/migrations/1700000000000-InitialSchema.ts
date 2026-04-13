import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ─── USERS TABLE ───────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM ('child', 'guardian', 'professional', 'admin')
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "email"         VARCHAR(255) UNIQUE NOT NULL,
        "passwordHash"  VARCHAR(255) NOT NULL,
        "role"          "user_role_enum" NOT NULL DEFAULT 'child',
        "displayName"   VARCHAR(255) NOT NULL,
        "isActive"      BOOLEAN NOT NULL DEFAULT true,
        "lgpdConsent"   BOOLEAN NOT NULL DEFAULT false,
        "consentDate"   TIMESTAMP WITH TIME ZONE,
        "pseudonymId"   VARCHAR(64) UNIQUE,
        "createdAt"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);

    // ─── CHILD PROFILES TABLE ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "support_level_enum" AS ENUM ('Mild', 'Moderated', 'Strong')
    `);

    await queryRunner.query(`
      CREATE TABLE "child_profiles" (
        "id"              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId"          UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "guardianId"      UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "ageYears"        SMALLINT NOT NULL CHECK ("ageYears" BETWEEN 6 AND 10),
        "gradeYear"       SMALLINT NOT NULL CHECK ("gradeYear" BETWEEN 1 AND 5),
        "supportLevel"    "support_level_enum" NOT NULL DEFAULT 'Moderated',
        "strengths"       TEXT[] NOT NULL DEFAULT '{}',
        "weaknesses"      TEXT[] NOT NULL DEFAULT '{}',
        "sensoryProfile"  JSONB NOT NULL DEFAULT '{}',
        "uiPreferences"   JSONB NOT NULL DEFAULT '{"theme":"calm","fontSize":"large","animations":false}',
        "ontologyGraph"   JSONB NOT NULL DEFAULT '{}',
        "createdAt"       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt"       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);

    // ─── BNCC SKILLS TABLE ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "bncc_thematic_unit_enum" AS ENUM (
        'Numeros', 'Algebra', 'Geometria', 'GrandezasMedidas', 'ProbabilidadeEstatistica'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "bncc_skills" (
        "id"            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "code"          VARCHAR(12) UNIQUE NOT NULL,
        "year"          SMALLINT NOT NULL CHECK ("year" BETWEEN 1 AND 5),
        "thematicUnit"  "bncc_thematic_unit_enum" NOT NULL,
        "description"   TEXT NOT NULL,
        "shortDesc"     VARCHAR(255) NOT NULL,
        "prerequisites" TEXT[] NOT NULL DEFAULT '{}',
        "metadata"      JSONB NOT NULL DEFAULT '{}',
        "createdAt"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);

    // ─── ACTIVITIES TABLE ──────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "activity_type_enum" AS ENUM (
        'multiple_choice', 'drag_drop', 'counting', 'visual_puzzle', 'yes_no', 'ia_sandbox'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "modality_enum" AS ENUM ('visual', 'auditory', 'text', 'interactive', 'video')
    `);

    await queryRunner.query(`
      CREATE TABLE "activities" (
        "id"            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "bnccSkillCode" VARCHAR(12) NOT NULL REFERENCES "bncc_skills"("code"),
        "type"          "activity_type_enum" NOT NULL,
        "modality"      "modality_enum" NOT NULL,
        "difficulty"    SMALLINT NOT NULL CHECK ("difficulty" BETWEEN 1 AND 5),
        "titlePt"       VARCHAR(255) NOT NULL,
        "titleEn"       VARCHAR(255),
        "content"       JSONB NOT NULL DEFAULT '{}',
        "tags"          TEXT[] NOT NULL DEFAULT '{}',
        "isActive"      BOOLEAN NOT NULL DEFAULT true,
        "createdAt"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_activities_bncc" ON "activities" ("bnccSkillCode")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_activities_difficulty" ON "activities" ("difficulty")
    `);

    // ─── SESSIONS TABLE ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "session_status_enum" AS ENUM ('active', 'paused', 'completed', 'abandoned')
    `);

    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id"              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "learnerId"       UUID NOT NULL REFERENCES "users"("id"),
        "startedAt"       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "endedAt"         TIMESTAMP WITH TIME ZONE,
        "status"          "session_status_enum" NOT NULL DEFAULT 'active',
        "totalDuration"   INTEGER DEFAULT 0,
        "activitiesCount" SMALLINT DEFAULT 0,
        "state"           JSONB NOT NULL DEFAULT '{}',
        "createdAt"       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_sessions_learner" ON "sessions" ("learnerId")
    `);

    // ─── ACTIVITY ATTEMPTS TABLE ───────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "attempt_result_enum" AS ENUM ('correct', 'incorrect', 'partial', 'skipped', 'timeout')
    `);

    await queryRunner.query(`
      CREATE TABLE "activity_attempts" (
        "id"              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "sessionId"       UUID NOT NULL REFERENCES "sessions"("id"),
        "learnerId"       UUID NOT NULL REFERENCES "users"("id"),
        "activityId"      UUID NOT NULL REFERENCES "activities"("id"),
        "result"          "attempt_result_enum" NOT NULL,
        "durationMs"      INTEGER NOT NULL DEFAULT 0,
        "hintsUsed"       SMALLINT NOT NULL DEFAULT 0,
        "attemptsCount"   SMALLINT NOT NULL DEFAULT 1,
        "responseData"    JSONB NOT NULL DEFAULT '{}',
        "behavioralSignals" JSONB NOT NULL DEFAULT '{}',
        "createdAt"       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_attempts_session" ON "activity_attempts" ("sessionId")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_attempts_learner" ON "activity_attempts" ("learnerId")
    `);

    // ─── ADE DECISIONS TABLE ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "ade_decisions" (
        "id"                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "learnerId"         UUID NOT NULL REFERENCES "users"("id"),
        "sessionId"         UUID NOT NULL REFERENCES "sessions"("id"),
        "attemptId"         UUID REFERENCES "activity_attempts"("id"),
        "nextActivityId"    UUID REFERENCES "activities"("id"),
        "difficultyAdjust"  SMALLINT NOT NULL DEFAULT 0,
        "modality"          "modality_enum",
        "feedbackType"      VARCHAR(64),
        "ontologyState"     JSONB NOT NULL DEFAULT '{}',
        "rulesApplied"      JSONB NOT NULL DEFAULT '[]',
        "mlPrediction"      JSONB NOT NULL DEFAULT '{}',
        "xaiRecord"         JSONB NOT NULL DEFAULT '{}',
        "processingMs"      INTEGER NOT NULL DEFAULT 0,
        "createdAt"         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_ade_learner" ON "ade_decisions" ("learnerId")
    `);

    // ─── ANALYTICS SNAPSHOTS TABLE ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "analytics_snapshots" (
        "id"                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "learnerId"           UUID NOT NULL REFERENCES "users"("id"),
        "sessionId"           UUID REFERENCES "sessions"("id"),
        "attemptId"           UUID REFERENCES "activity_attempts"("id"),
        "bnccSkillCode"       VARCHAR(12),
        "masteryProbability"  DECIMAL(4,3) NOT NULL DEFAULT 0,
        "engagementIndex"     DECIMAL(4,3) NOT NULL DEFAULT 0,
        "metrics"             JSONB NOT NULL DEFAULT '{}',
        "createdAt"           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_snapshots_learner" ON "analytics_snapshots" ("learnerId")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_snapshots_bncc" ON "analytics_snapshots" ("bnccSkillCode")
    `);

    // ─── ONTOLOGY INSTANCES TABLE ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "ontology_instances" (
        "id"          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "learnerId"   UUID UNIQUE NOT NULL REFERENCES "users"("id"),
        "graph"       JSONB NOT NULL DEFAULT '{}',
        "version"     SMALLINT NOT NULL DEFAULT 1,
        "updatedAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "ontology_instances" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "analytics_snapshots" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ade_decisions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "activity_attempts" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sessions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "activities" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bncc_skills" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "child_profiles" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "attempt_result_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "session_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "modality_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "activity_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "bncc_thematic_unit_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "support_level_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum"`);
  }
}