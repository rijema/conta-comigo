CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR NOT NULL,
  role VARCHAR NOT NULL DEFAULT 'guardian' CHECK (role IN ('child', 'guardian', 'professional', 'admin')),
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE, "lgpdConsentGiven" BOOLEAN NOT NULL DEFAULT FALSE,
  "lgpdConsentDate" TIMESTAMP, language VARCHAR NOT NULL DEFAULT 'pt-BR', preferences JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "externalAuthProvider" VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "externalAuthId" VARCHAR(255);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_external_auth_id" ON users("externalAuthId") WHERE "externalAuthId" IS NOT NULL;

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
  type VARCHAR NOT NULL CHECK (type IN (
    'visual_puzzle', 'quiz', 'video_question', 'yes_no', 'counting', 'drag_drop',
    'composition_decomposition', 'missing_number', 'pattern_completion',
    'representation_matching', 'error_detection', 'contextual_problem_solving'
  )),
  difficulty VARCHAR NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('very_easy', 'easy', 'medium', 'hard', 'extreme')),
  "bnccSkills" JSONB NOT NULL DEFAULT '[]', "targetModalities" JSONB NOT NULL DEFAULT '[]',
  "skillWeights" JSONB,
  content JSONB NOT NULL, accessibility JSONB, "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "pointsReward" INTEGER NOT NULL DEFAULT 0, "prerequisiteSkillCode" VARCHAR,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

DO $$
DECLARE
  activity_type_name TEXT;
  activity_type_value TEXT;
BEGIN
  SELECT udt_name INTO activity_type_name
  FROM information_schema.columns
  WHERE table_schema = current_schema()
    AND table_name = 'activities'
    AND column_name = 'type'
    AND data_type = 'USER-DEFINED';

  IF activity_type_name IS NOT NULL THEN
    FOREACH activity_type_value IN ARRAY ARRAY[
      'composition_decomposition', 'missing_number', 'pattern_completion',
      'representation_matching', 'error_detection', 'contextual_problem_solving'
    ] LOOP
      EXECUTE format(
        'ALTER TYPE %I ADD VALUE IF NOT EXISTS %L',
        activity_type_name,
        activity_type_value
      );
    END LOOP;
  END IF;
END $$;

ALTER TABLE activities ADD COLUMN IF NOT EXISTS "skillWeights" JSONB;
DO $$
DECLARE difficulty_type_name TEXT;
BEGIN
  SELECT udt_name INTO difficulty_type_name FROM information_schema.columns
  WHERE table_schema = current_schema() AND table_name = 'activities'
    AND column_name = 'difficulty' AND data_type = 'USER-DEFINED';
  IF difficulty_type_name IS NOT NULL THEN
    EXECUTE format('ALTER TYPE %I ADD VALUE IF NOT EXISTS %L', difficulty_type_name, 'very_easy');
    EXECUTE format('ALTER TYPE %I ADD VALUE IF NOT EXISTS %L', difficulty_type_name, 'extreme');
  END IF;
END $$;
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_difficulty_check;
ALTER TABLE activities ADD CONSTRAINT activities_difficulty_check
  CHECK (difficulty IN ('very_easy', 'easy', 'medium', 'hard', 'extreme'));

ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_type_check;
ALTER TABLE activities ADD CONSTRAINT activities_type_check CHECK (type IN (
  'visual_puzzle', 'quiz', 'video_question', 'yes_no', 'counting', 'drag_drop',
  'composition_decomposition', 'missing_number', 'pattern_completion',
  'representation_matching', 'error_detection', 'contextual_problem_solving'
));

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
  "adeDecisionContext" JSONB, "researchTrace" JSONB, "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
ALTER TABLE activity_attempts ADD COLUMN IF NOT EXISTS "researchTrace" JSONB;

CREATE TABLE IF NOT EXISTS ade_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "sessionId" VARCHAR, "recommendedDifficulty" VARCHAR NOT NULL, "recommendedModality" VARCHAR NOT NULL,
  "recommendedActivityType" VARCHAR, "recommendedBnccSkill" VARCHAR, "xaiLog" JSONB NOT NULL,
  "inputSnapshot" JSONB, "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE ade_decisions ADD COLUMN IF NOT EXISTS "selectedActivityId" UUID;
ALTER TABLE ade_decisions ADD COLUMN IF NOT EXISTS "hybridRanking" JSONB;
ALTER TABLE ade_decisions ADD COLUMN IF NOT EXISTS "decisionSource" VARCHAR;
ALTER TABLE ade_decisions ADD COLUMN IF NOT EXISTS "fallbackUsed" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE ade_decisions ADD COLUMN IF NOT EXISTS "fallbackReason" TEXT;

DO $$ BEGIN
  CREATE TYPE recommendation_outcome_status_enum AS ENUM ('PRESENTED', 'STARTED', 'COMPLETED', 'SKIPPED', 'ABANDONED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "sessionId" VARCHAR, "overallAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "engagementIndex" DOUBLE PRECISION NOT NULL DEFAULT 0, "averageTimePerActivity" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalActivitiesCompleted" INTEGER NOT NULL DEFAULT 0, "totalCorrect" INTEGER NOT NULL DEFAULT 0,
  "skillMasterySnapshot" JSONB, "bnccCoverage" JSONB, "behavioralPatterns" JSONB,
  "rawEventData" JSONB, "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TYPE learning_event_type_enum AS ENUM (
    'SESSION_STARTED', 'SESSION_COMPLETED', 'ACTIVITY_PRESENTED',
    'ACTIVITY_STARTED', 'ANSWER_SUBMITTED', 'ACTIVITY_COMPLETED',
    'ACTIVITY_SKIPPED', 'HINT_REQUESTED', 'TUTORIAL_OPENED',
    'INSTRUCTION_REPLAYED', 'RECOMMENDATION_GENERATED',
    'RECOMMENDATION_PRESENTED', 'RECOMMENDATION_COMPLETED',
    'DIFFICULTY_ADJUSTED', 'TITIA_INTERACTION',
    'pictogram_opened', 'visual_library_opened', 'visual_library_item_selected',
    'instruction_spoken', 'instruction_replayed', 'hint_spoken',
    'pictogram_spoken', 'speech_disabled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE learning_event_type_enum ADD VALUE IF NOT EXISTS 'pictogram_opened';
ALTER TYPE learning_event_type_enum ADD VALUE IF NOT EXISTS 'visual_library_opened';
ALTER TYPE learning_event_type_enum ADD VALUE IF NOT EXISTS 'visual_library_item_selected';
ALTER TYPE learning_event_type_enum ADD VALUE IF NOT EXISTS 'instruction_spoken';
ALTER TYPE learning_event_type_enum ADD VALUE IF NOT EXISTS 'instruction_replayed';
ALTER TYPE learning_event_type_enum ADD VALUE IF NOT EXISTS 'hint_spoken';
ALTER TYPE learning_event_type_enum ADD VALUE IF NOT EXISTS 'pictogram_spoken';
ALTER TYPE learning_event_type_enum ADD VALUE IF NOT EXISTS 'speech_disabled';
ALTER TYPE learning_event_type_enum ADD VALUE IF NOT EXISTS 'VOICE_INTERACTION_STARTED';
ALTER TYPE learning_event_type_enum ADD VALUE IF NOT EXISTS 'VOICE_COMMAND_RECOGNIZED';
ALTER TYPE learning_event_type_enum ADD VALUE IF NOT EXISTS 'VOICE_COMMAND_UNKNOWN';
ALTER TYPE learning_event_type_enum ADD VALUE IF NOT EXISTS 'VOICE_HELP_REQUESTED';
ALTER TYPE learning_event_type_enum ADD VALUE IF NOT EXISTS 'VOICE_INSTRUCTION_REPLAY_REQUESTED';
ALTER TYPE learning_event_type_enum ADD VALUE IF NOT EXISTS 'VOICE_ACTIVITY_CHANGE_REQUESTED';
ALTER TYPE learning_event_type_enum ADD VALUE IF NOT EXISTS 'ACTIVITY_ABANDONED';

CREATE TABLE IF NOT EXISTS learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), "studentId" UUID NOT NULL,
  "sessionId" VARCHAR NOT NULL, "eventType" learning_event_type_enum NOT NULL,
  "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "activityId" UUID,
  "bnccSkillId" UUID, attempt INTEGER, "responseTimeMs" INTEGER, correct BOOLEAN,
  "hintsUsed" INTEGER, "recommendationId" VARCHAR, metadata JSONB
);

CREATE TABLE IF NOT EXISTS recommendation_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), "recommendationId" UUID NOT NULL UNIQUE REFERENCES ade_decisions(id),
  "studentId" UUID NOT NULL REFERENCES users(id), "sessionId" VARCHAR NOT NULL,
  "activityId" UUID NOT NULL REFERENCES activities(id), status recommendation_outcome_status_enum NOT NULL,
  "presentedAt" TIMESTAMPTZ, "startedAt" TIMESTAMPTZ, "completedAt" TIMESTAMPTZ, "skippedAt" TIMESTAMPTZ, "abandonedAt" TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0, "hintsUsed" INTEGER NOT NULL DEFAULT 0,
  "instructionReplays" INTEGER NOT NULL DEFAULT 0, "responseTimeMs" INTEGER, correct BOOLEAN,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
ALTER TABLE recommendation_outcomes ADD COLUMN IF NOT EXISTS "abandonedAt" TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS adaptation_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), "studentId" UUID NOT NULL REFERENCES users(id),
  "sessionId" VARCHAR NOT NULL, "previousRecommendationId" UUID NOT NULL UNIQUE REFERENCES ade_decisions(id),
  "previousActivityId" UUID NOT NULL REFERENCES activities(id), "triggerEventId" UUID NOT NULL UNIQUE REFERENCES learning_events(id),
  "triggerType" VARCHAR NOT NULL, "changeRequested" BOOLEAN NOT NULL DEFAULT FALSE,
  "replacementRecommendationId" UUID REFERENCES ade_decisions(id),
  "replacementActivityId" UUID REFERENCES activities(id), "sameBNCCSkill" BOOLEAN,
  "sameMathematicalConcept" BOOLEAN, "interactionTypeChanged" BOOLEAN, "representationChanged" BOOLEAN,
  "motorDemandDelta" DOUBLE PRECISION, "sensoryLoadDelta" DOUBLE PRECISION,
  "languageLoadDelta" DOUBLE PRECISION, "scaffoldingDelta" DOUBLE PRECISION, "difficultyDelta" DOUBLE PRECISION,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
ALTER TABLE adaptation_transitions ADD COLUMN IF NOT EXISTS "difficultyDelta" DOUBLE PRECISION;
ALTER TABLE adaptation_transitions ADD COLUMN IF NOT EXISTS "changeRequested" BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS interaction_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), "sourceEventId" UUID NOT NULL UNIQUE REFERENCES learning_events(id),
  "studentId" UUID NOT NULL REFERENCES users(id), "sessionId" VARCHAR NOT NULL,
  "activityId" UUID NOT NULL REFERENCES activities(id), "recommendationId" UUID REFERENCES ade_decisions(id),
  "eventType" VARCHAR NOT NULL, "interactionType" JSONB, representation JSONB,
  "motorDemand" VARCHAR, "sensoryLoad" VARCHAR, "languageLoad" VARCHAR, outcome VARCHAR,
  timestamp TIMESTAMPTZ NOT NULL, metadata JSONB
);

DO $$ BEGIN
  CREATE TYPE professional_feedback_rating_enum AS ENUM ('ADEQUATE', 'PARTIALLY_ADEQUATE', 'INADEQUATE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS professional_recommendation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), "transitionId" UUID NOT NULL REFERENCES adaptation_transitions(id),
  "recommendationId" UUID NOT NULL REFERENCES ade_decisions(id), "sessionId" VARCHAR NOT NULL,
  "studentId" UUID NOT NULL REFERENCES users(id), "professionalId" UUID NOT NULL REFERENCES users(id),
  rating professional_feedback_rating_enum NOT NULL, "reasonCodes" JSONB NOT NULL DEFAULT '[]',
  "optionalComment" TEXT, "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE ("transitionId", "professionalId")
);

CREATE TABLE IF NOT EXISTS student_skill_states (
  "studentId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "skillId" UUID NOT NULL REFERENCES bncc_skills(id) ON DELETE CASCADE,
  "masteryProbability" DOUBLE PRECISION NOT NULL CHECK ("masteryProbability" BETWEEN 0 AND 1),
  observations INTEGER NOT NULL DEFAULT 0 CHECK (observations >= 0),
  "lastUpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("studentId", "skillId")
);

CREATE OR REPLACE FUNCTION prevent_learning_event_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'learning_events is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_learning_events_append_only ON learning_events;
CREATE TRIGGER trg_learning_events_append_only
BEFORE UPDATE OR DELETE ON learning_events
FOR EACH ROW EXECUTE FUNCTION prevent_learning_event_mutation();

CREATE INDEX IF NOT EXISTS idx_child_profiles_guardian ON child_profiles("guardianId");
CREATE INDEX IF NOT EXISTS idx_attempts_user ON activity_attempts("userId");
CREATE INDEX IF NOT EXISTS idx_attempts_activity ON activity_attempts("activityId");
CREATE INDEX IF NOT EXISTS idx_ade_user ON ade_decisions("userId");
CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_snapshots("userId");
CREATE INDEX IF NOT EXISTS idx_learning_events_student_timestamp ON learning_events("studentId", "timestamp");
CREATE INDEX IF NOT EXISTS idx_learning_events_session_timestamp ON learning_events("sessionId", "timestamp");
CREATE INDEX IF NOT EXISTS idx_learning_events_type_timestamp ON learning_events("eventType", "timestamp");
CREATE INDEX IF NOT EXISTS idx_student_skill_states_student ON student_skill_states("studentId");
CREATE INDEX IF NOT EXISTS idx_student_skill_states_skill ON student_skill_states("skillId");
