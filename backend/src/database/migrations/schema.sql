-- MathASD Database Schema
-- Initial schema for PostgreSQL

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'child',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Child profiles table
CREATE TABLE IF NOT EXISTS child_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  age INT,
  asd_level VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  bncc_skill_id VARCHAR(50),
  difficulty VARCHAR(50),
  activity_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity attempts table
CREATE TABLE IF NOT EXISTS activity_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  correct BOOLEAN,
  response_time_ms INT,
  hints_used INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ADE decisions table
CREATE TABLE IF NOT EXISTS ade_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  decision_data JSONB,
  xai_trace JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics snapshots table
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  bncc_skill_id VARCHAR(50),
  mastery_probability DECIMAL(5, 4),
  engagement_score DECIMAL(5, 4),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_child_profiles_user_id ON child_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_attempts_child_id ON activity_attempts(child_id);
CREATE INDEX IF NOT EXISTS idx_activity_attempts_activity_id ON activity_attempts(activity_id);
CREATE INDEX IF NOT EXISTS idx_ade_decisions_child_id ON ade_decisions(child_id);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_child_id ON analytics_snapshots(child_id);
