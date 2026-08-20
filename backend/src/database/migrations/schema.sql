CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR NOT NULL,
  role VARCHAR NOT NULL DEFAULT 'guardian' CHECK (role IN ('child', 'guardian', 'professional', 'admin')),
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE, "lgpdConsentGiven" BOOLEAN NOT NULL DEFAULT FALSE,
  "lgpdConsentDate" TIMESTAMP, language VARCHAR NOT NULL DEFAULT 'pt-BR', preferences JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS child_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), "userId" UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  "guardianId" UUID REFERENCES users(id) ON DELETE SET NULL, age INTEGER, "schoolYear" INTEGER,
  "asdSupportLevel" VARCHAR, strengths JSONB, weaknesses JSONB, "uiPreferences" JSONB,
  "skillMastery" JSONB, "bnccProgress" JSONB, "ontologyInstanceData" JSONB,
  "totalPoints" INTEGER NOT NULL DEFAULT 0, "currentLevel" INTEGER NOT NULL DEFAULT 1,
  "currentStreak" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title VARCHAR(255) NOT NULL, description TEXT,
  type VARCHAR NOT NULL CHECK (type IN ('visual_puzzle', 'quiz', 'video_question', 'yes_no', 'counting', 'drag_drop')),
  difficulty VARCHAR NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  "bnccSkills" JSONB NOT NULL DEFAULT '[]', "targetModalities" JSONB NOT NULL DEFAULT '[]',
  content JSONB NOT NULL, accessibility JSONB, "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "pointsReward" INTEGER NOT NULL DEFAULT 0, "prerequisiteSkillCode" VARCHAR,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bncc_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), code VARCHAR(20) UNIQUE NOT NULL,
  year INTEGER NOT NULL, thematic_unit VARCHAR(50) NOT NULL, knowledge_object TEXT NOT NULL,
  description TEXT NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "activityId" UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE, "sessionId" VARCHAR,
  "isCorrect" BOOLEAN NOT NULL DEFAULT FALSE, score DOUBLE PRECISION NOT NULL DEFAULT 0,
  "timeSpentSeconds" INTEGER, "hintsUsed" INTEGER, "interactionSignals" JSONB,
  "adeDecisionContext" JSONB, "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ade_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "sessionId" VARCHAR, "recommendedDifficulty" VARCHAR NOT NULL, "recommendedModality" VARCHAR NOT NULL,
  "recommendedActivityType" VARCHAR, "recommendedBnccSkill" VARCHAR, "xaiLog" JSONB NOT NULL,
  "inputSnapshot" JSONB, "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "sessionId" VARCHAR, "overallAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "engagementIndex" DOUBLE PRECISION NOT NULL DEFAULT 0, "averageTimePerActivity" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalActivitiesCompleted" INTEGER NOT NULL DEFAULT 0, "totalCorrect" INTEGER NOT NULL DEFAULT 0,
  "skillMasterySnapshot" JSONB, "bnccCoverage" JSONB, "behavioralPatterns" JSONB,
  "rawEventData" JSONB, "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_child_profiles_guardian ON child_profiles("guardianId");
CREATE INDEX IF NOT EXISTS idx_attempts_user ON activity_attempts("userId");
CREATE INDEX IF NOT EXISTS idx_attempts_activity ON activity_attempts("activityId");
CREATE INDEX IF NOT EXISTS idx_ade_user ON ade_decisions("userId");
CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_snapshots("userId");
