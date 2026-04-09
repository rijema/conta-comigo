-- =====================================================
-- ASD Adaptive Platform — Initial Database Schema
-- Aligned with LASDONT ontology and BNCC math skills
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('child', 'guardian', 'educator', 'admin')),
    name VARCHAR(255) NOT NULL,
    preferred_language VARCHAR(10) DEFAULT 'pt',
    lgpd_consent BOOLEAN DEFAULT FALSE,
    lgpd_consent_date TIMESTAMPTZ,
    anonymized BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CHILD PROFILES TABLE
-- Aligned with LASDONT ontology:
-- Strengths/Weaknesses: visual, auditive, motor, logical, sensory
-- Support levels: mild, moderated, strong
-- =====================================================
CREATE TABLE IF NOT EXISTS child_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    guardian_id UUID REFERENCES users(id),
    age INTEGER CHECK (age BETWEEN 6 AND 10),
    school_year INTEGER CHECK (school_year BETWEEN 1 AND 5),
    asd_support_level VARCHAR(20) CHECK (asd_support_level IN ('mild', 'moderated', 'strong')),
    ontology_profile JSONB DEFAULT '{
        "strengths": [],
        "weaknesses": [],
        "preferredModality": "visual",
        "sensoryProfile": {
            "visualStrength": false,
            "auditiveStrength": false,
            "motorStrength": false,
            "logicalStrength": false,
            "sensoryStrength": false,
            "visualWeakness": false,
            "auditiveWeakness": false,
            "motorWeakness": false,
            "logicalWeakness": false,
            "sensoryWeakness": false
        }
    }',
    accessibility_settings JSONB DEFAULT '{
        "highContrast": false,
        "lowStimulation": false,
        "fontSize": "medium",
        "animationsEnabled": true,
        "soundEnabled": true
    }',
    current_level INTEGER DEFAULT 1,
    total_stars INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- BNCC SKILLS TABLE
-- Source: BNCC 2018, Mathematics, Anos Iniciais (1-5)
-- =====================================================
CREATE TABLE IF NOT EXISTS bncc_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    year INTEGER CHECK (year BETWEEN 1 AND 5),
    thematic_unit VARCHAR(50),
    knowledge_object TEXT,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ACTIVITIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    title_en VARCHAR(255),
    bncc_skill_code VARCHAR(20) REFERENCES bncc_skills(code),
    activity_type VARCHAR(50) CHECK (activity_type IN (
        'visual_quiz', 'textual_quiz', 'visual_puzzle',
        'yes_no_video', 'question_video', 'ia_sandbox', 'number_line'
    )),
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
    school_year INTEGER CHECK (school_year BETWEEN 1 AND 5),
    recommended_modalities TEXT[] DEFAULT '{}',
    content JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_profile_id UUID REFERENCES child_profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    activities_completed INTEGER DEFAULT 0,
    stars_earned INTEGER DEFAULT 0,
    state JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ACTIVITY ATTEMPTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    child_profile_id UUID REFERENCES child_profiles(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES activities(id),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    is_correct BOOLEAN,
    score NUMERIC(5,2) DEFAULT 0,
    time_spent_seconds INTEGER,
    hints_used INTEGER DEFAULT 0,
    attempt_number INTEGER DEFAULT 1,
    interaction_signals JSONB DEFAULT '{
        "clickCount": 0,
        "pauseCount": 0,
        "hesitationEvents": [],
        "errorPattern": []
    }',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ADE DECISIONS TABLE
-- Adaptive Decision Engine output with XAI logging
-- =====================================================
CREATE TABLE IF NOT EXISTS ade_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_profile_id UUID REFERENCES child_profiles(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id),
    triggered_by VARCHAR(50),
    input_data JSONB NOT NULL,
    ontology_inferences JSONB DEFAULT '{}',
    rule_outputs JSONB DEFAULT '{}',
    ml_predictions JSONB DEFAULT '{}',
    decision JSONB NOT NULL,
    xai_record JSONB DEFAULT '{}',
    next_activity_id UUID REFERENCES activities(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ANALYTICS SNAPSHOTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS analytics_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_profile_id UUID REFERENCES child_profiles(id) ON DELETE CASCADE,
    snapshot_type VARCHAR(50),
    bkt_states JSONB DEFAULT '{}',
    engagement_index NUMERIC(5,4) DEFAULT 0,
    behavioral_patterns JSONB DEFAULT '{}',
    bncc_trajectory JSONB DEFAULT '{}',
    metrics JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ONTOLOGY INSTANCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ontology_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_profile_id UUID REFERENCES child_profiles(id) ON DELETE CASCADE,
    ontology_class VARCHAR(100),
    instance_name VARCHAR(100),
    properties JSONB DEFAULT '{}',
    graph JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_activity_attempts_child ON activity_attempts(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_activity_attempts_session ON activity_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_ade_decisions_child ON ade_decisions(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_child ON analytics_snapshots(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_sessions_child ON sessions(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
