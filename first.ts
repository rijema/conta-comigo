ASD Adaptive Math Platform — Full Working System
Complete Implementation Guide

📁 Project Structure
Copyasd-adaptive-platform/
├── backend/                          # NestJS + TypeScript
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.guard.ts
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── dto/
│   │   │   │       ├── login.dto.ts
│   │   │   │       └── register.dto.ts
│   │   │   ├── users/
│   │   │   │   ├── users.module.ts
│   │   │   │   ├── users.controller.ts
│   │   │   │   ├── users.service.ts
│   │   │   │   └── dto/
│   │   │   │       ├── create-user.dto.ts
│   │   │   │       └── create-child-profile.dto.ts
│   │   │   ├── activities/
│   │   │   │   ├── activities.module.ts
│   │   │   │   ├── activities.controller.ts
│   │   │   │   ├── activities.service.ts
│   │   │   │   └── dto/
│   │   │   │       ├── create-activity.dto.ts
│   │   │   │       └── submit-attempt.dto.ts
│   │   │   ├── analytics/
│   │   │   │   ├── analytics.module.ts
│   │   │   │   ├── analytics.controller.ts
│   │   │   │   ├── analytics.service.ts
│   │   │   │   ├── analytics.consumer.ts
│   │   │   │   └── dto/
│   │   │   │       └── analytics-snapshot.dto.ts
│   │   │   └── ade/
│   │   │       ├── ade.module.ts
│   │   │       ├── ade.controller.ts
│   │   │       ├── ade.service.ts
│   │   │       ├── ontology/
│   │   │       │   ├── ontology-reasoner.ts
│   │   │       │   └── lasdont.json
│   │   │       ├── rules/
│   │   │       │   └── rule-engine.ts
│   │   │       └── dto/
│   │   │           └── ade-decision.dto.ts
│   │   ├── shared/
│   │   │   ├── database/
│   │   │   │   ├── database.module.ts
│   │   │   │   └── migrations/
│   │   │   │       └── 001_initial_schema.sql
│   │   │   ├── kafka/
│   │   │   │   ├── kafka.module.ts
│   │   │   │   └── kafka.service.ts
│   │   │   ├── logger/
│   │   │   │   └── logger.service.ts
│   │   │   └── interceptors/
│   │   │       └── logging.interceptor.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── Dockerfile
├── ml-service/                       # Python + FastAPI
│   ├── app/
│   │   ├── main.py
│   │   ├── models/
│   │   │   ├── bkt_model.py
│   │   │   ├── engagement_classifier.py
│   │   │   └── modality_recommender.py
│   │   ├── schemas/
│   │   │   └── prediction_schemas.py
│   │   ├── services/
│   │   │   └── ml_service.py
│   │   └── data/
│   │       └── seed_model.py
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
├── frontend/                         # Next.js 14
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── register/page.tsx
│   │   │   ├── learner/
│   │   │   │   ├── page.tsx
│   │   │   │   └── activity/[id]/page.tsx
│   │   │   ├── guardian/
│   │   │   │   └── page.tsx
│   │   │   └── educator/
│   │   │       └── page.tsx
│   │   ├── components/
│   │   │   ├── activity/
│   │   │   │   ├── ActivityRenderer.tsx
│   │   │   │   ├── MultipleChoice.tsx
│   │   │   │   ├── VisualPuzzle.tsx
│   │   │   │   └── NumberLine.tsx
│   │   │   ├── ui/
│   │   │   │   ├── AccessibilityPanel.tsx
│   │   │   │   ├── ProgressBar.tsx
│   │   │   │   ├── StarReward.tsx
│   │   │   │   └── FeedbackModal.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── BnccCoverageMap.tsx
│   │   │   │   └── ProgressChart.tsx
│   │   │   └── layout/
│   │   │       ├── Header.tsx
│   │   │       └── SensoryThemeProvider.tsx
│   │   ├── hooks/
│   │   │   ├── useActivity.ts
│   │   │   ├── useADE.ts
│   │   │   └── useAccessibility.ts
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   └── i18n/
│   │   │       ├── pt.json
│   │   │       └── en.json
│   │   ├── store/
│   │   │   └── accessibility.store.ts
│   │   └── types/
│   │       └── index.ts
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── .env.example
├── docker-compose.yml
├── docker-compose.dev.yml
└── README.md

🔧 BACKEND — NestJS + TypeScript
backend/package.json
jsonCopy{
  "name": "asd-adaptive-backend",
  "version": "1.0.0",
  "description": "ASD Adaptive Math Platform Backend",
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "migration:run": "ts-node src/shared/database/run-migrations.ts"
  },
  "dependencies": {
    "@nestjs/common": "^10.3.0",
    "@nestjs/core": "^10.3.0",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/platform-express": "^10.3.0",
    "@nestjs/microservices": "^10.3.0",
    "@nestjs/config": "^3.2.0",
    "@nestjs/throttler": "^5.1.2",
    "kafkajs": "^2.2.4",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "pg": "^8.11.3",
    "bcryptjs": "^2.4.3",
    "class-validator": "^0.14.1",
    "class-transformer": "^0.5.1",
    "axios": "^1.6.7",
    "reflect-metadata": "^0.2.1",
    "rxjs": "^7.8.1",
    "uuid": "^9.0.0",
    "winston": "^3.11.0",
    "nest-winston": "^1.9.4"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.3.2",
    "@nestjs/schematics": "^10.1.1",
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^20.11.5",
    "@types/passport-jwt": "^4.0.1",
    "@types/pg": "^8.11.0",
    "@types/uuid": "^9.0.7",
    "typescript": "^5.3.3",
    "ts-node": "^10.9.2"
  }
}
backend/tsconfig.json
jsonCopy{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true
  }
}
backend/src/main.ts
typescriptCopyimport { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

async function bootstrap() {
  const logger = WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
            return `${timestamp} [${context || 'App'}] ${level}: ${message} ${
              Object.keys(meta).length ? JSON.stringify(meta) : ''
            }`;
          }),
        ),
      }),
      new winston.transports.File({
        filename: 'logs/app.log',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    ],
  });

  const app = await NestFactory.create(AppModule, { logger });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new LoggingInterceptor());

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Backend running on http://localhost:${port}/api/v1`);
}
bootstrap();
backend/src/app.module.ts
typescriptCopyimport { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AdeModule } from './modules/ade/ade.module';
import { DatabaseModule } from './shared/database/database.module';
import { KafkaModule } from './shared/kafka/kafka.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    DatabaseModule,
    KafkaModule,
    AuthModule,
    UsersModule,
    ActivitiesModule,
    AnalyticsModule,
    AdeModule,
  ],
})
export class AppModule {}
backend/src/shared/database/database.module.ts
typescriptCopyimport { Module, Global } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';

export const DATABASE_POOL = 'DATABASE_POOL';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_POOL,
      useFactory: (configService: ConfigService) => {
        return new Pool({
          connectionString: configService.get<string>('DATABASE_URL'),
          ssl:
            configService.get<string>('NODE_ENV') === 'production'
              ? { rejectUnauthorized: false }
              : false,
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [DATABASE_POOL],
})
export class DatabaseModule {}
backend/src/shared/database/migrations/001_initial_schema.sql
sqlCopy-- =====================================================
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
    code VARCHAR(20) UNIQUE NOT NULL,  -- e.g., EF01MA01
    year INTEGER CHECK (year BETWEEN 1 AND 5),
    thematic_unit VARCHAR(50),  -- Números, Álgebra, Geometria, etc.
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

-- =====================================================
-- SEED BNCC SKILLS (Anos Iniciais focus: 1st-5th year)
-- =====================================================
INSERT INTO bncc_skills (code, year, thematic_unit, knowledge_object, description) VALUES
('EF01MA01', 1, 'Números', 'Contagem de rotina', 'Utilizar números naturais como indicador de quantidade ou de ordem em diferentes situações cotidianas'),
('EF01MA06', 1, 'Números', 'Construção de fatos básicos da adição', 'Construir fatos básicos da adição e utilizá-los em procedimentos de cálculo'),
('EF01MA08', 1, 'Números', 'Problemas adição e subtração', 'Resolver e elaborar problemas de adição e de subtração'),
('EF02MA05', 2, 'Números', 'Fatos fundamentais adição e subtração', 'Construir fatos básicos da adição e subtração e utilizá-los no cálculo mental ou escrito'),
('EF02MA07', 2, 'Números', 'Problemas multiplicação', 'Resolver e elaborar problemas de multiplicação por 2, 3, 4 e 5'),
('EF03MA07', 3, 'Números', 'Problemas multiplicação', 'Resolver e elaborar problemas de multiplicação por 2, 3, 4, 5 e 10'),
('EF03MA08', 3, 'Números', 'Problemas divisão', 'Resolver e elaborar problemas de divisão de um número natural por outro'),
('EF04MA06', 4, 'Números', 'Problemas multiplicação', 'Resolver e elaborar problemas envolvendo diferentes significados da multiplicação'),
('EF04MA07', 4, 'Números', 'Problemas divisão', 'Resolver e elaborar problemas de divisão'),
('EF05MA07', 5, 'Números', 'Problemas adição e subtração racionais', 'Resolver e elaborar problemas de adição e subtração com números naturais e racionais'),
('EF01MA14', 1, 'Geometria', 'Figuras geométricas planas', 'Identificar e nomear figuras planas em desenhos'),
('EF02MA15', 2, 'Geometria', 'Figuras geométricas planas', 'Reconhecer, comparar e nomear figuras planas'),
('EF03MA15', 3, 'Geometria', 'Figuras geométricas planas', 'Classificar e comparar figuras planas')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- SEED ACTIVITIES
-- =====================================================
INSERT INTO activities (title, title_en, bncc_skill_code, activity_type, difficulty, school_year, recommended_modalities, content) VALUES
(
  'Contando Maçãs',
  'Counting Apples',
  'EF01MA01',
  'visual_quiz',
  'easy',
  1,
  ARRAY['visual', 'logical'],
  '{
    "question": "Quantas maçãs você vê?",
    "question_en": "How many apples do you see?",
    "imageUrl": "/assets/activities/apples_3.png",
    "options": [{"value": "2", "label": "2"}, {"value": "3", "label": "3"}, {"value": "4", "label": "4"}],
    "correctAnswer": "3",
    "hint": "Conte cada maçã com o dedo!",
    "hint_en": "Count each apple with your finger!",
    "stars": 1,
    "feedbackCorrect": "Incrível! Você acertou!",
    "feedbackIncorrect": "Tente de novo! Conte devagar."
  }'
),
(
  'Somando com Blocos',
  'Adding with Blocks',
  'EF01MA06',
  'visual_puzzle',
  'easy',
  1,
  ARRAY['visual', 'logical'],
  '{
    "question": "2 + 3 = ?",
    "question_en": "2 + 3 = ?",
    "visualBlocks": {"left": 2, "right": 3},
    "options": [{"value": "4", "label": "4"}, {"value": "5", "label": "5"}, {"value": "6", "label": "6"}],
    "correctAnswer": "5",
    "hint": "Use os dedinhos para contar!",
    "hint_en": "Use your fingers to count!",
    "stars": 2,
    "feedbackCorrect": "Fantástico! Você é um campeão!",
    "feedbackIncorrect": "Quase lá! Tente contar os blocos."
  }'
),
(
  'Tabuada do 2',
  'Times Table of 2',
  'EF02MA07',
  'visual_quiz',
  'medium',
  2,
  ARRAY['visual', 'logical'],
  '{
    "question": "2 × 4 = ?",
    "question_en": "2 × 4 = ?",
    "imageUrl": "/assets/activities/groups_2x4.png",
    "options": [{"value": "6", "label": "6"}, {"value": "8", "label": "8"}, {"value": "10", "label": "10"}],
    "correctAnswer": "8",
    "hint": "Some 2 quatro vezes: 2+2+2+2",
    "hint_en": "Add 2 four times: 2+2+2+2",
    "stars": 3,
    "feedbackCorrect": "Excelente! Você está arrasando!",
    "feedbackIncorrect": "Pense: 2 grupos de 4 coisas."
  }'
)
ON CONFLICT DO NOTHING;
backend/src/shared/kafka/kafka.module.ts
typescriptCopyimport { Module, Global } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}
backend/src/shared/kafka/kafka.service.ts
typescriptCopyimport { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Consumer, EachMessagePayload, logLevel } from 'kafkajs';

export const KAFKA_TOPICS = {
  SESSION_EVENTS: 'platform.session.events',
  ACTIVITY_EVENTS: 'platform.activity.events',
  ADE_DECISIONS: 'platform.ade.decisions',
  ANALYTICS_UPDATES: 'platform.analytics.updates',
  ALERTS: 'platform.alerts',
} as const;

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private producer: Producer;
  private consumers: Map<string, Consumer> = new Map();
  private isKafkaAvailable = false;

  constructor(private configService: ConfigService) {
    const brokers = this.configService.get<string>('KAFKA_BROKERS', 'localhost:9092');

    this.kafka = new Kafka({
      clientId: 'asd-adaptive-platform',
      brokers: brokers.split(','),
      logLevel: logLevel.WARN,
    });

    this.producer = this.kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
    });
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      this.isKafkaAvailable = true;
      this.logger.log('Kafka producer connected successfully');
    } catch (error) {
      this.logger.warn(
        `Kafka not available (${error.message}). Running in degraded mode. Events will be logged only.`,
      );
      this.isKafkaAvailable = false;
    }
  }

  async onModuleDestroy() {
    if (this.isKafkaAvailable) {
      await this.producer.disconnect();
      for (const [groupId, consumer] of this.consumers) {
        await consumer.disconnect();
        this.logger.log(`Consumer ${groupId} disconnected`);
      }
    }
  }

  async publish(topic: string, message: Record<string, unknown>): Promise<void> {
    const payload = {
      topic,
      messageId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...message,
    };

    this.logger.debug(`Publishing to ${topic}: ${JSON.stringify(payload)}`);

    if (!this.isKafkaAvailable) {
      this.logger.debug(`[KAFKA-DEGRADED] Would publish to ${topic}: ${JSON.stringify(payload)}`);
      return;
    }

    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: (message.childProfileId as string) || 'global',
            value: JSON.stringify(payload),
            timestamp: Date.now().toString(),
          },
        ],
      });
    } catch (error) {
      this.logger.error(`Failed to publish to ${topic}: ${error.message}`);
    }
  }

  async subscribe(
    topic: string,
    groupId: string,
    handler: (message: Record<string, unknown>) => Promise<void>,
  ): Promise<void> {
    if (!this.isKafkaAvailable) {
      this.logger.warn(`Kafka not available. Skipping subscription to ${topic}`);
      return;
    }

    const consumer = this.kafka.consumer({ groupId });
    this.consumers.set(groupId, consumer);

    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ message }: EachMessagePayload) => {
        try {
          const parsed = JSON.parse(message.value?.toString() || '{}');
          await handler(parsed);
        } catch (error) {
          this.logger.error(`Error processing message from ${topic}: ${error.message}`);
        }
      },
    });

    this.logger.log(`Subscribed to ${topic} with group ${groupId}`);
  }
}
backend/src/shared/interceptors/logging.interceptor.ts
typescriptCopyimport {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method, url, ip } = req;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse();
          const duration = Date.now() - startTime;
          this.logger.log(
            `${method} ${url} ${res.statusCode} ${duration}ms - ${ip}`,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `${method} ${url} ERROR ${duration}ms - ${error.message}`,
          );
        },
      }),
    );
  }
}

🔐 AUTH MODULE
backend/src/modules/auth/dto/login.dto.ts
typescriptCopyimport { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
backend/src/modules/auth/dto/register.dto.ts
typescriptCopyimport { IsEmail, IsString, MinLength, IsIn, IsBoolean } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  name: string;

  @IsIn(['child', 'guardian', 'educator'])
  role: string;

  @IsBoolean()
  lgpdConsent: boolean;

  @IsString()
  @IsIn(['pt', 'en'])
  preferredLanguage: string = 'pt';
}
backend/src/modules/auth/auth.service.ts
typescriptCopyimport {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Inject } from '@nestjs/common';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import { DATABASE_POOL } from '../../shared/database/database.module';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(DATABASE_POOL) private readonly db: Pool,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    if (!dto.lgpdConsent) {
      throw new BadRequestException('LGPD consent is required');
    }

    const existing = await this.db.query(
      'SELECT id FROM users WHERE email = $1',
      [dto.email],
    );
    if (existing.rows.length > 0) {
      throw new BadRequestException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const result = await this.db.query(
      `INSERT INTO users (email, password_hash, name, role, preferred_language, lgpd_consent, lgpd_consent_date)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, email, name, role, preferred_language`,
      [dto.email, passwordHash, dto.name, dto.role, dto.preferredLanguage, true],
    );

    const user = result.rows[0];
    this.logger.log(`New user registered: ${user.id} (${user.role})`);

    const token = this.jwtService.sign({ sub: user.id, role: user.role });
    return { user, accessToken: token };
  }

  async login(dto: LoginDto) {
    const result = await this.db.query(
      'SELECT id, email, name, role, password_hash, preferred_language FROM users WHERE email = $1 AND anonymized = FALSE',
      [dto.email],
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({ sub: user.id, role: user.role });
    this.logger.log(`User logged in: ${user.id}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        preferredLanguage: user.preferred_language,
      },
      accessToken: token,
    };
  }

  async validateToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
backend/src/modules/auth/auth.controller.ts
typescriptCopyimport { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
backend/src/modules/auth/jwt.strategy.ts
typescriptCopyimport { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../../shared/database/database.module';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(DATABASE_POOL) private readonly db: Pool,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'default-dev-secret-change-in-prod'),
    });
  }

  async validate(payload: { sub: string; role: string }) {
    const result = await this.db.query(
      'SELECT id, email, name, role FROM users WHERE id = $1 AND anonymized = FALSE',
      [payload.sub],
    );
    if (result.rows.length === 0) {
      throw new UnauthorizedException();
    }
    return { id: payload.sub, role: payload.role, ...result.rows[0] };
  }
}
backend/src/modules/auth/auth.guard.ts
typescriptCopyimport { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
backend/src/modules/auth/auth.module.ts
typescriptCopyimport { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'default-dev-secret'),
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}

🧠 ADE MODULE — Core Adaptive Decision Engine
backend/src/modules/ade/ontology/lasdont.json
jsonCopy{
  "@context": {
    "@vocab": "http://www.semanticweb.org/ricma/ontologies/2024/11/LASDONT.owl#",
    "rdfs": "http://www.w3.org/2000/01/rdf-schema#"
  },
  "@id": "LASDONT",
  "classes": {
    "Strength_and_Weakness_Class": {
      "subclasses": ["Strengths", "Weaknesses"]
    },
    "Strengths": {
      "subclasses": ["Visual_Strength", "Auditive_Strength", "Motor_Strength", "Logical_Strength", "Sensory_Strength"]
    },
    "Weaknesses": {
      "subclasses": ["Visual_Weakness", "Auditive_Weakness", "Motor_Weakness", "Logical_Weakness", "Sensory_Weakness"]
    },
    "Treatments_Class": {
      "subclasses": ["DIY", "Puzzles", "Quizzes", "Videos"]
    },
    "DIY": {
      "subclasses": ["IA_Sandbox_DIY"]
    },
    "Puzzles": {
      "subclasses": ["Visual_Puzzles"]
    },
    "Quizzes": {
      "subclasses": ["Textual_Quizzes", "Visual_Quizzes"]
    },
    "Videos": {
      "subclasses": ["Question_Videos", "Yes_No_Videos"]
    },
    "Percentage": {
      "subclasses": ["Mild_Learning_Percentage", "Moderated_Percentage", "Strong_Percentage"]
    }
  },
  "objectProperties": {
    "hasStrength": {
      "domain": "Strengths",
      "range": "Treatments_Class",
      "inverse": "isRelatedToStrength"
    },
    "hasWeakness": {
      "domain": "Weaknesses",
      "range": "Treatments_Class",
      "inverse": "isRelatedToWeakness"
    },
    "hasContentConnection": {
      "subproperties": ["hasStrength", "hasWeakness"]
    }
  },
  "rules": {
    "Visual_Puzzles_Rule": {
      "description": "Visual Puzzles are recommended when learner has Logical + Sensory + Visual Strengths",
      "conditions": {
        "requiredStrengths": ["Logical_Strength", "Sensory_Strength", "Visual_Strength"]
      },
      "recommendation": "Visual_Puzzles"
    },
    "Textual_Quizzes_Rule": {
      "description": "Textual Quizzes for learners with Logical Strength",
      "conditions": {
        "requiredStrengths": ["Logical_Strength"]
      },
      "recommendation": "Textual_Quizzes"
    },
    "Visual_Quizzes_Rule": {
      "description": "Visual Quizzes for learners with Visual Strength",
      "conditions": {
        "requiredStrengths": ["Visual_Strength"]
      },
      "recommendation": "Visual_Quizzes"
    },
    "Question_Videos_Rule": {
      "description": "Question Videos for Visual Strength + Motor Weakness or Logical Weakness",
      "conditions": {
        "requiredStrengths": ["Visual_Strength"],
        "acceptableWeaknesses": ["Motor_Weakness", "Logical_Weakness"]
      },
      "recommendation": "Question_Videos"
    },
    "Yes_No_Videos_Rule": {
      "description": "Yes/No Videos for learners with Logical or Motor Weakness",
      "conditions": {
        "requiredWeaknesses": ["Logical_Weakness", "Motor_Weakness"]
      },
      "recommendation": "Yes_No_Videos"
    },
    "IA_Sandbox_Rule": {
      "description": "IA Sandbox for learners with Sensory + Visual Strength",
      "conditions": {
        "requiredStrengths": ["Sensory_Strength", "Visual_Strength"]
      },
      "recommendation": "IA_Sandbox_DIY"
    }
  },
  "supportLevelMap": {
    "mild": {
      "percentage": "Mild_Learning_Percentage",
      "contentDifficulty": "hard",
      "preferredTreatments": ["Textual_Quizzes", "Visual_Puzzles", "Question_Videos"]
    },
    "moderated": {
      "percentage": "Moderated_Percentage",
      "contentDifficulty": "medium",
      "preferredTreatments": ["Visual_Quizzes", "Visual_Puzzles", "Yes_No_Videos"]
    },
    "strong": {
      "percentage": "Strong_Percentage",
      "contentDifficulty": "easy",
      "preferredTreatments": ["Yes_No_Videos", "IA_Sandbox_DIY", "Visual_Quizzes"]
    }
  }
}
backend/src/modules/ade/ontology/ontology-reasoner.ts
typescriptCopyimport { Injectable, Logger } from '@nestjs/common';
import ontologyData from './lasdont.json';

export interface LearnerOntologyProfile {
  strengths: string[];
  weaknesses: string[];
  supportLevel: 'mild' | 'moderated' | 'strong';
  preferredModality: string;
}

export interface OntologyInference {
  inferredClass: string;
  matchedStrengths: string[];
  matchedWeaknesses: string[];
  confidence: number;
  reasoning: string;
  recommendedTreatments: string[];
}

@Injectable()
export class OntologyReasoner {
  private readonly logger = new Logger(OntologyReasoner.name);
  private readonly ontology = ontologyData;

  /**
   * Infers the appropriate treatment class based on LASDONT ontology rules.
   * Applies OWL-inspired classification logic using JSON rule definitions.
   */
  reason(profile: LearnerOntologyProfile): OntologyInference[] {
    const inferences: OntologyInference[] = [];
    const rules = this.ontology.rules;
    const supportMap = this.ontology.supportLevelMap;

    this.logger.debug(`Running ontology reasoning for profile: ${JSON.stringify(profile)}`);

    // Apply each rule from the LASDONT ontology
    for (const [ruleName, rule] of Object.entries(rules)) {
      const conditions = rule.conditions as {
        requiredStrengths?: string[];
        requiredWeaknesses?: string[];
        acceptableWeaknesses?: string[];
      };

      let strengthMatch = 0;
      let weaknessMatch = 0;
      const matchedStrengths: string[] = [];
      const matchedWeaknesses: string[] = [];

      // Check required strengths
      if (conditions.requiredStrengths) {
        for (const req of conditions.requiredStrengths) {
          if (profile.strengths.includes(req)) {
            strengthMatch++;
            matchedStrengths.push(req);
          }
        }
      }

      // Check required weaknesses
      if (conditions.requiredWeaknesses) {
        for (const req of conditions.requiredWeaknesses) {
          if (profile.weaknesses.includes(req)) {
            weaknessMatch++;
            matchedWeaknesses.push(req);
          }
        }
      }

      // Check acceptable weaknesses (OR condition)
      if (conditions.acceptableWeaknesses) {
        for (const acc of conditions.acceptableWeaknesses) {
          if (profile.weaknesses.includes(acc)) {
            weaknessMatch++;
            matchedWeaknesses.push(acc);
          }
        }
      }

      // Calculate confidence
      const totalRequired =
        (conditions.requiredStrengths?.length || 0) +
        (conditions.requiredWeaknesses?.length || 0);

      const totalMatched = matchedStrengths.length + matchedWeaknesses.length;
      const confidence = totalRequired > 0 ? totalMatched / totalRequired : 0;

      if (confidence > 0) {
        // Cross-reference with support level
        const supportPreferred = supportMap[profile.supportLevel]?.preferredTreatments || [];
        const isSupportAligned = supportPreferred.includes(rule.recommendation);
        const adjustedConfidence = isSupportAligned ? Math.min(confidence * 1.2, 1.0) : confidence;

        inferences.push({
          inferredClass: rule.recommendation,
          matchedStrengths,
          matchedWeaknesses,
          confidence: adjustedConfidence,
          reasoning: `Rule '${ruleName}': matched ${matchedStrengths.length}/${conditions.requiredStrengths?.length || 0} strengths, ${matchedWeaknesses.length} weaknesses. Support level '${profile.supportLevel}' ${isSupportAligned ? 'aligned' : 'not aligned'}.`,
          recommendedTreatments: [rule.recommendation],
        });
      }
    }

    // Sort by confidence descending
    inferences.sort((a, b) => b.confidence - a.confidence);

    this.logger.debug(
      `Ontology reasoning completed. Top inference: ${inferences[0]?.inferredClass} (${inferences[0]?.confidence?.toFixed(2)})`,
    );

    return inferences;
  }

  /**
   * Maps treatment class to activity type in the database
   */
  mapTreatmentToActivityType(treatment: string): string {
    const mapping: Record<string, string> = {
      Visual_Puzzles: 'visual_puzzle',
      Textual_Quizzes: 'textual_quiz',
      Visual_Quizzes: 'visual_quiz',
      Question_Videos: 'question_video',
      Yes_No_Videos: 'yes_no_video',
      IA_Sandbox_DIY: 'ia_sandbox',
    };
    return mapping[treatment] || 'visual_quiz';
  }

  /**
   * Infers support level content difficulty
   */
  getContentDifficulty(supportLevel: string): string {
    return this.ontology.supportLevelMap[supportLevel]?.contentDifficulty || 'medium';
  }
}
backend/src/modules/ade/rules/rule-engine.ts
typescriptCopyimport { Injectable, Logger } from '@nestjs/common';

export interface RuleInput {
  childProfileId: string;
  bktMastery: Record<string, number>;
  engagementIndex: number;
  recentErrors: string[];
  sessionDuration: number;
  consecutiveCorrect: number;
  consecutiveWrong: number;
  currentDifficulty: string;
  currentBnccCode: string;
  supportLevel: string;
}

export interface RuleOutput {
  ruleName: string;
  fired: boolean;
  action: string;
  adjustment: Record<string, unknown>;
  reason: string;
  priority: number;
}

/**
 * SWRL-equivalent rule engine implemented in TypeScript.
 * Each rule encodes a pedagogical constraint aligned with
 * ASD educational research and BNCC progression logic.
 */
@Injectable()
export class RuleEngine {
  private readonly logger = new Logger(RuleEngine.name);

  evaluate(input: RuleInput): RuleOutput[] {
    const outputs: RuleOutput[] = [];

    // Rule 1: Frustration Detection
    // If child gets 3+ consecutive wrong answers → reduce difficulty
    if (input.consecutiveWrong >= 3) {
      outputs.push({
        ruleName: 'R01_FRUSTRATION_DETECT',
        fired: true,
        action: 'REDUCE_DIFFICULTY',
        adjustment: {
          difficultyChange: -1,
          addHint: true,
          pauseRecommended: input.consecutiveWrong >= 5,
        },
        reason: `${input.consecutiveWrong} consecutive wrong answers detected — reducing cognitive load`,
        priority: 10,
      });
    }

    // Rule 2: Mastery Achievement
    // If BKT mastery > 0.85 for current skill → advance to next
    const currentSkillMastery = input.bktMastery[input.currentBnccCode] || 0;
    if (currentSkillMastery > 0.85 && input.consecutiveCorrect >= 3) {
      outputs.push({
        ruleName: 'R02_MASTERY_ADVANCE',
        fired: true,
        action: 'ADVANCE_SKILL',
        adjustment: {
          incrementLevel: true,
          celebrateAchievement: true,
          nextBnccProgression: true,
        },
        reason: `BKT mastery ${currentSkillMastery.toFixed(2)} > 0.85 with ${input.consecutiveCorrect} consecutive correct — skill mastered`,
        priority: 9,
      });
    }

    // Rule 3: Engagement Drop
    // If engagement index < 0.3 → switch modality
    if (input.engagementIndex < 0.3) {
      outputs.push({
        ruleName: 'R03_LOW_ENGAGEMENT',
        fired: true,
        action: 'SWITCH_MODALITY',
        adjustment: {
          switchActivityType: true,
          addVisualReward: true,
          reduceProblemLength: true,
        },
        reason: `Engagement index ${input.engagementIndex.toFixed(2)} below threshold 0.3 — switching modality`,
        priority: 8,
      });
    }

    // Rule 4: Session Duration Alert
    // ASD children often need structured session limits
    if (input.sessionDuration > 1800) {
      outputs.push({
        ruleName: 'R04_SESSION_DURATION',
        fired: true,
        action: 'SUGGEST_BREAK',
        adjustment: {
          breakSuggested: true,
          notifyGuardian: input.sessionDuration > 2700,
        },
        reason: `Session duration ${Math.floor(input.sessionDuration / 60)} min exceeds 30min recommendation for ASD learners`,
        priority: 7,
      });
    }

    // Rule 5: BNCC Prerequisite Gate
    // Support-level-aware gating
    if (input.supportLevel === 'strong' && input.currentDifficulty === 'hard') {
      outputs.push({
        ruleName: 'R05_SUPPORT_GATE',
        fired: true,
        action: 'DOWNGRADE_DIFFICULTY',
        adjustment: {
          targetDifficulty: 'easy',
          increaseVisualSupport: true,
        },
        reason: `Strong support level learner should not receive hard difficulty — downgrading`,
        priority: 9,
      });
    }

    // Rule 6: Scaffolding for new topics
    if (currentSkillMastery < 0.2 && input.consecutiveCorrect === 0) {
      outputs.push({
        ruleName: 'R06_NEW_TOPIC_SCAFFOLD',
        fired: true,
        action: 'ADD_SCAFFOLDING',
        adjustment: {
          showExampleFirst: true,
          enableHints: true,
          targetDifficulty: 'easy',
        },
        reason: `Low mastery ${currentSkillMastery.toFixed(2)} on new topic — adding scaffolding`,
        priority: 6,
      });
    }

    const fired = outputs.filter((o) => o.fired);
    this.logger.debug(
      `Rule engine evaluated ${outputs.length} rules. ${fired.length} fired.`,
    );

    return fired.sort((a, b) => b.priority - a.priority);
  }
}
backend/src/modules/ade/ade.service.ts
typescriptCopyimport { Injectable, Logger, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { DATABASE_POOL } from '../../shared/database/database.module';
import { KafkaService, KAFKA_TOPICS } from '../../shared/kafka/kafka.service';
import { OntologyReasoner } from './ontology/ontology-reasoner';
import { RuleEngine } from './rules/rule-engine';

export interface AdeInput {
  childProfileId: string;
  sessionId: string;
  currentActivityId?: string;
  lastAttempt?: {
    isCorrect: boolean;
    score: number;
    timeSpentSeconds: number;
    hintsUsed: number;
  };
  triggerReason: 'session_start' | 'activity_complete' | 'frustration' | 'manual';
}

export interface AdeDecision {
  nextActivityId: string | null;
  nextActivityType: string;
  difficultyAdjustment: string;
  preferredModality: string;
  feedbackMessage: string;
  feedbackMessage_en: string;
  xaiRecord: {
    ontologyInferences: unknown[];
    rulesApplied: unknown[];
    mlPredictions: unknown;
    finalReasoning: string;
  };
}

@Injectable()
export class AdeService {
  private readonly logger = new Logger(AdeService.name);

  constructor(
    @Inject(DATABASE_POOL) private readonly db: Pool,
    private readonly kafkaService: KafkaService,
    private readonly ontologyReasoner: OntologyReasoner,
    private readonly ruleEngine: RuleEngine,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Core ADE pipeline:
   * 1. Load ontology profile from DB
   * 2. Run ontology reasoner (LASDONT-based)
   * 3. Apply rule engine (pedagogical constraints)
   * 4. Call ML service (BKT + engagement)
   * 5. Synthesize decision + build XAI record
   * 6. Persist decision and publish event
   */
  async makeDecision(input: AdeInput): Promise<AdeDecision> {
    this.logger.log(
      `ADE triggered for child ${input.childProfileId}, reason: ${input.triggerReason}`,
    );

    // Step 1: Load child profile and analytics
    const profileResult = await this.db.query(
      `SELECT cp.*, 
              COALESCE(snap.bkt_states, '{}') as bkt_states,
              COALESCE(snap.engagement_index, 0.5) as engagement_index,
              COALESCE(snap.bncc_trajectory, '{}') as bncc_trajectory
       FROM child_profiles cp
       LEFT JOIN LATERAL (
         SELECT bkt_states, engagement_index, bncc_trajectory
         FROM analytics_snapshots
         WHERE child_profile_id = cp.id
         ORDER BY created_at DESC LIMIT 1
       ) snap ON TRUE
       WHERE cp.id = $1`,
      [input.childProfileId],
    );

    if (profileResult.rows.length === 0) {
      throw new Error(`Child profile not found: ${input.childProfileId}`);
    }

    const profile = profileResult.rows[0];

    // Step 2: Get recent activity attempts for rule engine
    const attemptsResult = await this.db.query(
      `SELECT is_correct, score, time_spent_seconds, hints_used, 
              a.bncc_skill_code, aa.created_at
       FROM activity_attempts aa
       JOIN activities a ON aa.activity_id = a.id
       WHERE aa.child_profile_id = $1 AND aa.session_id = $2
       ORDER BY aa.created_at DESC LIMIT 10`,
      [input.childProfileId, input.sessionId],
    );

    const attempts = attemptsResult.rows;

    // Calculate consecutive correct/wrong
    let consecutiveCorrect = 0;
    let consecutiveWrong = 0;
    for (const a of attempts) {
      if (a.is_correct) {
        consecutiveCorrect++;
        if (consecutiveWrong > 0) break;
      } else {
        consecutiveWrong++;
        if (consecutiveCorrect > 0) break;
      }
    }

    const ontologyProfile = profile.ontology_profile || {};
    const sessionResult = await this.db.query(
      'SELECT EXTRACT(EPOCH FROM (NOW() - started_at)) as duration FROM sessions WHERE id = $1',
      [input.sessionId],
    );
    const sessionDuration = parseFloat(sessionResult.rows[0]?.duration || '0');

    const currentBnccCode = attempts[0]?.bncc_skill_code || 'EF01MA01';

    // Step 3: Ontology Reasoning (LASDONT)
    const ontologyInferences = this.ontologyReasoner.reason({
      strengths: ontologyProfile.strengths || ['Visual_Strength'],
      weaknesses: ontologyProfile.weaknesses || [],
      supportLevel: profile.asd_support_level || 'moderated',
      preferredModality: ontologyProfile.preferredModality || 'visual',
    });

    // Step 4: Rule Engine
    const ruleOutputs = this.ruleEngine.evaluate({
      childProfileId: input.childProfileId,
      bktMastery: profile.bkt_states || {},
      engagementIndex: parseFloat(profile.engagement_index) || 0.5,
      recentErrors: attempts.filter((a) => !a.is_correct).map((a) => a.bncc_skill_code),
      sessionDuration,
      consecutiveCorrect,
      consecutiveWrong,
      currentDifficulty: 'medium',
      currentBnccCode,
      supportLevel: profile.asd_support_level || 'moderated',
    });

    // Step 5: ML Service Integration
    let mlPredictions = {
      masteryProbability: 0.5,
      engagementClass: 'medium',
      recommendedDifficulty: 'medium',
      nextActivityType: 'visual_quiz',
    };

    try {
      const mlInput = {
        childProfileId: input.childProfileId,
        bnccCode: currentBnccCode,
        recentAttempts: attempts.slice(0, 5).map((a) => ({
          isCorrect: a.is_correct,
          score: parseFloat(a.score) || 0,
          timeSpent: a.time_spent_seconds || 0,
          hintsUsed: a.hints_used || 0,
        })),
        currentMastery: profile.bkt_states?.[currentBnccCode] || 0.3,
        engagementIndex: parseFloat(profile.engagement_index) || 0.5,
        supportLevel: profile.asd_support_level || 'moderated',
        strengths: ontologyProfile.strengths || [],
      };

      const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
      const mlResponse = await firstValueFrom(
        this.httpService.post(`${mlServiceUrl}/predict`, mlInput, {
          timeout: 5000,
        }),
      );
      mlPredictions = mlResponse.data;
      this.logger.debug(`ML predictions: ${JSON.stringify(mlPredictions)}`);
    } catch (error) {
      this.logger.warn(`ML service unavailable: ${error.message}. Using fallback predictions.`);
    }

    // Step 6: Decision Synthesis
    const topOntologyInference = ontologyInferences[0];
    const topRule = ruleOutputs[0];

    // Determine activity type from ontology + ML
    const activityType =
      topRule?.action === 'SWITCH_MODALITY'
        ? mlPredictions.nextActivityType
        : this.ontologyReasoner.mapTreatmentToActivityType(
            topOntologyInference?.inferredClass || 'Visual_Quizzes',
          );

    // Determine difficulty
    let difficulty = mlPredictions.recommendedDifficulty;
    if (topRule?.adjustment?.targetDifficulty) {
      difficulty = topRule.adjustment.targetDifficulty as string;
    } else if (topRule?.action === 'REDUCE_DIFFICULTY' && difficulty === 'hard') {
      difficulty = 'medium';
    } else if (topRule?.action === 'REDUCE_DIFFICULTY' && difficulty === 'medium') {
      difficulty = 'easy';
    }

    // Find next activity from DB
    const nextActivityResult = await this.db.query(
      `SELECT id FROM activities 
       WHERE activity_type = $1 
         AND difficulty = $2 
         AND school_year = $3 
         AND is_active = TRUE
         AND id != $4
       ORDER BY RANDOM() LIMIT 1`,
      [
        activityType,
        difficulty,
        profile.school_year || 1,
        input.currentActivityId || '00000000-0000-0000-0000-000000000000',
      ],
    );

    const nextActivityId = nextActivityResult.rows[0]?.id || null;

    // Build feedback messages
    const feedbackMap = {
      REDUCE_DIFFICULTY: {
        pt: 'Vamos tentar uma atividade mais fácil! Você consegue! 💪',
        en: "Let's try an easier activity! You can do it! 💪",
      },
      ADVANCE_SKILL: {
        pt: 'Parabéns! Você dominou essa habilidade! 🌟 Próximo desafio!',
        en: 'Congratulations! You mastered this skill! 🌟 Next challenge!',
      },
      SWITCH_MODALITY: {
        pt: 'Vamos aprender de um jeito diferente! 🎨',
        en: "Let's learn in a different way! 🎨",
      },
      default: {
        pt: 'Ótimo trabalho! Continue assim! ⭐',
        en: 'Great work! Keep it up! ⭐',
      },
    };

    const feedbackKey = topRule?.action || 'default';
    const feedback = feedbackMap[feedbackKey] || feedbackMap.default;

    // Build XAI record
    const xaiRecord = {
      ontologyInferences: ontologyInferences.slice(0, 3),
      rulesApplied: ruleOutputs,
      mlPredictions,
      finalReasoning: [
        `Ontology top inference: ${topOntologyInference?.inferredClass} (confidence: ${topOntologyInference?.confidence?.toFixed(2)})`,
        `Top rule fired: ${topRule?.ruleName || 'none'} — ${topRule?.reason || 'no rule fired'}`,
        `ML recommended: difficulty=${mlPredictions.recommendedDifficulty}, type=${mlPredictions.nextActivityType}`,
        `Final decision: type=${activityType}, difficulty=${difficulty}`,
      ].join(' | '),
    };

    const decision: AdeDecision = {
      nextActivityId,
      nextActivityType: activityType,
      difficultyAdjustment: difficulty,
      preferredModality: topOntologyInference?.inferredClass || 'Visual_Quizzes',
      feedbackMessage: feedback.pt,
      feedbackMessage_en: feedback.en,
      xaiRecord,
    };

    // Step 7: Persist decision
    await this.db.query(
      `INSERT INTO ade_decisions 
       (child_profile_id, session_id, triggered_by, input_data, ontology_inferences, rule_outputs, ml_predictions, decision, xai_record, next_activity_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        input.childProfileId,
        input.sessionId,
        input.triggerReason,
        JSON.stringify(input),
        JSON.stringify(ontologyInferences),
        JSON.stringify(ruleOutputs),
        JSON.stringify(mlPredictions),
        JSON.stringify(decision),
        JSON.stringify(xaiRecord),
        nextActivityId,
      ],
    );

    // Step 8: Publish event
    await this.kafkaService.publish(KAFKA_TOPICS.ADE_DECISIONS, {
      eventType: 'ade.decision.made',
      childProfileId: input.childProfileId,
      sessionId: input.sessionId,
      decision,
      xaiRecord,
    });

    this.logger.log(
      `ADE decision for ${input.childProfileId}: type=${activityType}, difficulty=${difficulty}, nextActivity=${nextActivityId}`,
    );

    return decision;
  }
}
backend/src/modules/ade/ade.controller.ts
typescriptCopyimport { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AdeService, AdeInput } from './ade.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { IsString, IsOptional, IsIn, IsObject } from 'class-validator';

class AdeRequestDto implements AdeInput {
  @IsString()
  childProfileId: string;

  @IsString()
  sessionId: string;

  @IsOptional()
  @IsString()
  currentActivityId?: string;

  @IsOptional()
  @IsObject()
  lastAttempt?: {
    isCorrect: boolean;
    score: number;
    timeSpentSeconds: number;
    hintsUsed: number;
  };

  @IsIn(['session_start', 'activity_complete', 'frustration', 'manual'])
  triggerReason: 'session_start' | 'activity_complete' | 'frustration' | 'manual';
}

@Controller('ade')
@UseGuards(JwtAuthGuard)
export class AdeController {
  constructor(private readonly adeService: AdeService) {}

  @Post('decide')
  async makeDecision(@Body() dto: AdeRequestDto) {
    return this.adeService.makeDecision(dto);
  }
}
backend/src/modules/ade/ade.module.ts
typescriptCopyimport { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AdeController } from './ade.controller';
import { AdeService } from './ade.service';
import { OntologyReasoner } from './ontology/ontology-reasoner';
import { RuleEngine } from './rules/rule-engine';

@Module({
  imports: [HttpModule],
  controllers: [AdeController],
  providers: [AdeService, OntologyReasoner, RuleEngine],
  exports: [AdeService],
})
export class AdeModule {}

📊 ANALYTICS MODULE
backend/src/modules/analytics/analytics.service.ts
typescriptCopyimport { Injectable, Logger, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../../shared/database/database.module';
import { KafkaService, KAFKA_TOPICS } from '../../shared/kafka/kafka.service';

interface ActivityEventPayload {
  childProfileId: string;
  sessionId: string;
  activityId: string;
  bnccCode: string;
  isCorrect: boolean;
  score: number;
  timeSpentSeconds: number;
  hintsUsed: number;
  interactionSignals: Record<string, unknown>;
}

interface BktState {
  mastery: number;
  attempts: number;
  correctCount: number;
}

/**
 * Bayesian Knowledge Tracing (BKT) Implementation
 * Standard 4-parameter BKT model:
 * - P(Learn): probability of transitioning from not-knowing to knowing
 * - P(Forget): probability of forgetting (set to 0 for simplicity)
 * - P(Guess): probability of correct answer when not knowing
 * - P(Slip): probability of wrong answer when knowing
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  // BKT Parameters (empirically tuned for elementary math)
  private readonly BKT_PARAMS = {
    pLearn: 0.3,   // P(T): transition probability
    pForget: 0.0,  // P(F): forgetting rate
    pGuess: 0.25,  // P(G): guess rate
    pSlip: 0.1,    // P(S): slip rate
    pInit: 0.2,    // P(L0): initial knowledge
  };

  constructor(
    @Inject(DATABASE_POOL) private readonly db: Pool,
    private readonly kafkaService: KafkaService,
  ) {}

  /**
   * Process an activity completion event:
   * 1. Update BKT state for the skill
   * 2. Calculate engagement index
   * 3. Update BNCC trajectory
   * 4. Save analytics snapshot
   */
  async processActivityEvent(payload: ActivityEventPayload): Promise<void> {
    this.logger.debug(
      `Processing activity event for child ${payload.childProfileId}, skill ${payload.bnccCode}`,
    );

    // Load existing analytics snapshot
    const snapResult = await this.db.query(
      `SELECT bkt_states, engagement_index, bncc_trajectory, behavioral_patterns
       FROM analytics_snapshots
       WHERE child_profile_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [payload.childProfileId],
    );

    const existing = snapResult.rows[0] || {};
    const bktStates: Record<string, BktState> = existing.bkt_states || {};
    const bnccTrajectory: Record<string, unknown> = existing.bncc_trajectory || {};

    // Update BKT for the specific skill
    const updatedBkt = this.updateBkt(
      bktStates[payload.bnccCode],
      payload.isCorrect,
    );
    bktStates[payload.bnccCode] = updatedBkt;

    // Calculate engagement index
    const engagementIndex = this.calculateEngagementIndex({
      timeSpent: payload.timeSpentSeconds,
      hintsUsed: payload.hintsUsed,
      isCorrect: payload.isCorrect,
      interactionSignals: payload.interactionSignals,
    });

    // Update BNCC trajectory
    const skillTrajectory = bnccTrajectory[payload.bnccCode] || {
      attempts: 0,
      correct: 0,
      masteryHistory: [],
    };
    (skillTrajectory as Record<string, unknown>).attempts = ((skillTrajectory as Record<string, unknown>).attempts as number) + 1;
    if (payload.isCorrect) {
      (skillTrajectory as Record<string, unknown>).correct = ((skillTrajectory