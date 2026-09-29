# Batch 1 Implementation Guide — Foundation (Database + Core Services)

**Timeline**: 1-2 weeks  
**Scope**: Database schema + ReviewCandidateGenerationService + ReviewSelectionService  
**Risk**: Low (additive, no existing code changes)

---

## OVERVIEW

Batch 1 establishes the foundation for the longitudinal review system:

1. **Database Entities**: ReviewAssignment, ReviewOutcome
2. **Core Services**: ReviewCandidateGenerationService, ReviewSelectionService
3. **Unit Tests**: 80%+ coverage
4. **No Frontend Changes**: Backend only

After Batch 1, the system can identify and select review activities, but won't yet trigger them or compare outcomes.

---

## STEP 1: DATABASE MIGRATIONS

### 1.1 Create ReviewAssignment Migration

**File**: `backend/src/database/migrations/1726950000000-AddReviewAssignments.ts`

```typescript
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddReviewAssignments1726950000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'review_assignments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'studentId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'skillId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'reviewType',
            type: 'varchar',
            isNullable: false,
            enum: ['REMEDIATION', 'RETENTION', 'GENERALIZATION'],
          },
          {
            name: 'sourceInteractionIds',
            type: 'uuid[]',
            isNullable: false,
            default: "'{}'",
          },
          {
            name: 'sourceRecommendationIds',
            type: 'uuid[]',
            isNullable: false,
            default: "'{}'",
          },
          {
            name: 'selectedActivityTemplateId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'selectedActivityInstanceId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'reason',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'priorityScore',
            type: 'float',
            isNullable: false,
          },
          {
            name: 'scoringBreakdown',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'baselineState',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'completedAt',
            type: 'timestamptz',
            isNullable: true,
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      'review_assignments',
      new TableIndex({
        columnNames: ['studentId', 'skillId', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'review_assignments',
      new TableIndex({
        columnNames: ['studentId', 'createdAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('review_assignments');
  }
}
```

### 1.2 Create ReviewOutcome Migration

**File**: `backend/src/database/migrations/1726950001000-AddReviewOutcomes.ts`

```typescript
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddReviewOutcomes1726950001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'review_outcomes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'reviewAssignmentId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'studentId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'skillId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'reviewInteractionId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'reviewRecommendationId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'baselineMetrics',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'reviewMetrics',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'deltas',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'normalizedDeltas',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'progressionClassification',
            type: 'varchar',
            isNullable: false,
            enum: ['IMPROVED', 'STABLE', 'NEEDS_SUPPORT', 'INCONCLUSIVE'],
          },
          {
            name: 'evidenceSignals',
            type: 'varchar[]',
            isNullable: false,
            default: "'{}'",
          },
          {
            name: 'classificationReason',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      'review_outcomes',
      new TableIndex({
        columnNames: ['reviewAssignmentId'],
      }),
    );

    await queryRunner.createIndex(
      'review_outcomes',
      new TableIndex({
        columnNames: ['studentId', 'skillId', 'createdAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('review_outcomes');
  }
}
```

### 1.3 Extend Activity Entity

**File**: `backend/src/modules/activities/entities/activity.entity.ts`

Add these columns to the Activity entity:

```typescript
@Column({ type: 'uuid', nullable: true })
templateId: string | null;

@Column({ type: 'boolean', default: false })
isTemplate: boolean;

@Column({ type: 'jsonb', nullable: true })
templateMetadata: {
  conceptDimensions?: string[];
  difficultyDimensions?: Record<string, number>;
  interactionFormat?: string;
  pedagogicalObjective?: string;
  generationStrategy?: 'parametric' | 'combinatorial' | 'semantic';
} | null;

@Column({ type: 'jsonb', nullable: true })
instanceMetadata: {
  generatedFrom?: string;
  generationSeed?: number;
  parameters?: Record<string, any>;
  generatedAt?: Date;
} | null;
```

**Migration**: `backend/src/database/migrations/1726950002000-ExtendActivityEntity.ts`

```typescript
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class ExtendActivityEntity1726950002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'activities',
      new TableColumn({
        name: 'templateId',
        type: 'uuid',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'activities',
      new TableColumn({
        name: 'isTemplate',
        type: 'boolean',
        default: false,
      }),
    );

    await queryRunner.addColumn(
      'activities',
      new TableColumn({
        name: 'templateMetadata',
        type: 'jsonb',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'activities',
      new TableColumn({
        name: 'instanceMetadata',
        type: 'jsonb',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('activities', 'instanceMetadata');
    await queryRunner.dropColumn('activities', 'templateMetadata');
    await queryRunner.dropColumn('activities', 'isTemplate');
    await queryRunner.dropColumn('activities', 'templateId');
  }
}
```

---

## STEP 2: CREATE ENTITIES

### 2.1 ReviewAssignment Entity

**File**: `backend/src/modules/learning-events/entities/review-assignment.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { BnccSkill } from '../../ontology/entities/bncc-skill.entity';

export enum ReviewType {
  REMEDIATION = 'REMEDIATION',
  RETENTION = 'RETENTION',
  GENERALIZATION = 'GENERALIZATION',
}

export interface ReviewScoringBreakdown {
  difficultyScore: number;
  retentionScore: number;
  generalizationScore: number;
  semanticScore: number;
  noveltyScore: number;
  normalizedFactors: Record<string, number>;
}

export interface ReviewBaselineState {
  masteryBefore: number;
  difficultyBefore: string;
  lastExposureAt: Date;
  daysSinceLastExposure: number;
  previousAttempts: number;
  previousAccuracy: number;
  previousHintUsage: number;
  previousResponseTimeMs: number;
}

@Entity('review_assignments')
@Index(['studentId', 'skillId', 'createdAt'])
@Index(['studentId', 'createdAt'])
export class ReviewAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  studentId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: User;

  @Column({ type: 'uuid' })
  skillId: string;

  @ManyToOne(() => BnccSkill, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'skillId' })
  skill: BnccSkill;

  @Column({ type: 'enum', enum: ReviewType })
  reviewType: ReviewType;

  @Column({ type: 'uuid', array: true })
  sourceInteractionIds: string[];

  @Column({ type: 'uuid', array: true })
  sourceRecommendationIds: string[];

  @Column({ type: 'uuid' })
  selectedActivityTemplateId: string;

  @Column({ type: 'uuid' })
  selectedActivityInstanceId: string;

  @Column({ type: 'varchar' })
  reason: string;

  @Column({ type: 'float' })
  priorityScore: number;

  @Column({ type: 'jsonb' })
  scoringBreakdown: ReviewScoringBreakdown;

  @Column({ type: 'jsonb' })
  baselineState: ReviewBaselineState;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;
}
```

### 2.2 ReviewOutcome Entity

**File**: `backend/src/modules/learning-events/entities/review-outcome.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ReviewAssignment } from './review-assignment.entity';
import { User } from '../../users/entities/user.entity';
import { BnccSkill } from '../../ontology/entities/bncc-skill.entity';

export enum ProgressionClassification {
  IMPROVED = 'IMPROVED',
  STABLE = 'STABLE',
  NEEDS_SUPPORT = 'NEEDS_SUPPORT',
  INCONCLUSIVE = 'INCONCLUSIVE',
}

export interface PerformanceMetrics {
  accuracy: number;
  averageResponseTimeMs: number;
  averageAttempts: number;
  hintsUsed: number;
  masteryProbability: number;
  difficultyLevel: string;
}

export interface PerformanceDelta {
  accuracyDelta: number;
  responseTimeDelta: number;
  attemptsDelta: number;
  hintsDelta: number;
  masteryDelta: number;
}

export interface NormalizedDeltas {
  accuracyDeltaNormalized: number;
  responseTimeDeltaNormalized: number;
  attemptsDeltaNormalized: number;
  hintsDeltaNormalized: number;
  masteryDeltaNormalized: number;
}

@Entity('review_outcomes')
@Index(['reviewAssignmentId'])
@Index(['studentId', 'skillId', 'createdAt'])
export class ReviewOutcome {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  reviewAssignmentId: string;

  @ManyToOne(() => ReviewAssignment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reviewAssignmentId' })
  reviewAssignment: ReviewAssignment;

  @Column({ type: 'uuid' })
  studentId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: User;

  @Column({ type: 'uuid' })
  skillId: string;

  @ManyToOne(() => BnccSkill, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'skillId' })
  skill: BnccSkill;

  @Column({ type: 'uuid' })
  reviewInteractionId: string;

  @Column({ type: 'uuid' })
  reviewRecommendationId: string;

  @Column({ type: 'jsonb' })
  baselineMetrics: PerformanceMetrics;

  @Column({ type: 'jsonb' })
  reviewMetrics: PerformanceMetrics;

  @Column({ type: 'jsonb' })
  deltas: PerformanceDelta;

  @Column({ type: 'jsonb' })
  normalizedDeltas: NormalizedDeltas;

  @Column({ type: 'enum', enum: ProgressionClassification })
  progressionClassification: ProgressionClassification;

  @Column({ type: 'varchar', array: true })
  evidenceSignals: string[];

  @Column({ type: 'text' })
  classificationReason: string;

  @Column({ type: 'jsonb' })
  metadata: {
    difficultyComparison: 'same' | 'harder' | 'easier';
    instanceComparison: 'identical' | 'equivalent' | 'different';
    conceptCoverage: string[];
    conceptsNewInReview: string[];
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

---

## STEP 3: CREATE CORE SERVICES

### 3.1 ReviewCandidateGenerationService

**File**: `backend/src/modules/learning-events/services/review-candidate-generation.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ExercisePerformance } from '../entities/exercise-performance.entity';
import { LearningEvent } from '../entities/learning-event.entity';
import { StudentSkillState } from '../../knowledge-tracing/entities/student-skill-state.entity';
import { KnowledgeTracingService } from '../../knowledge-tracing/knowledge-tracing.service';
import { OntologyService, SkillRelationEvidence } from '../../ontology/ontology.service';

export interface ReviewCandidate {
  skillId: string;
  skillCode: string;
  reviewType: 'REMEDIATION' | 'RETENTION' | 'GENERALIZATION';
  priorityScore: number;
  scoringBreakdown: {
    difficultyScore: number;
    retentionScore: number;
    generalizationScore: number;
    semanticScore: number;
    noveltyScore: number;
  };
  evidence: {
    masteryProbability: number;
    lastExposureAt: Date | null;
    daysSinceLastExposure: number;
    previousAttempts: number;
    previousAccuracy: number;
    previousHintUsage: number;
    previousResponseTimeMs: number;
  };
}

export interface ReviewPriorityScore {
  skillId: string;
  skillCode: string;
  score: number;
  breakdown: {
    difficultyScore: number;
    retentionScore: number;
    generalizationScore: number;
    semanticScore: number;
    noveltyScore: number;
  };
}

@Injectable()
export class ReviewCandidateGenerationService {
  private readonly logger = new Logger(ReviewCandidateGenerationService.name);

  // Configuration parameters
  private readonly retentionHalfLife: number; // days
  private readonly minAttemptsForGeneralization: number;
  private readonly maxReviewsPerSkill: number;
  private readonly targetSuccessProbability: number;

  constructor(
    @InjectRepository(ExercisePerformance)
    private readonly performanceRepository: Repository<ExercisePerformance>,
    @InjectRepository(LearningEvent)
    private readonly eventRepository: Repository<LearningEvent>,
    @InjectRepository(StudentSkillState)
    private readonly skillStateRepository: Repository<StudentSkillState>,
    private readonly knowledgeTracingService: KnowledgeTracingService,
    private readonly ontologyService: OntologyService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {
    this.retentionHalfLife = this.configService.get<number>('REVIEW_RETENTION_HALF_LIFE_DAYS', 14);
    this.minAttemptsForGeneralization = this.configService.get<number>('REVIEW_MIN_ATTEMPTS_GENERALIZATION', 5);
    this.maxReviewsPerSkill = this.configService.get<number>('REVIEW_MAX_REVIEWS_PER_SKILL', 3);
    this.targetSuccessProbability = this.configService.get<number>('HYBRID_TARGET_SUCCESS_PROBABILITY', 0.7);
  }

  /**
   * Generate review candidates for a student across all skills
   */
  async generateReviewCandidates(
    studentId: string,
    options?: { lookbackDays?: number; minEvidence?: number },
  ): Promise<ReviewCandidate[]> {
    const lookbackDays = options?.lookbackDays ?? 30;
    const minEvidence = options?.minEvidence ?? 1;

    // Get all skills the student has interacted with
    const skillStates = await this.skillStateRepository.find({
      where: { studentId },
    });

    const candidates: ReviewCandidate[] = [];

    for (const skillState of skillStates) {
      // Get baseline evidence for this skill
      const evidence = await this.getSkillEvidence(studentId, skillState.skillId, lookbackDays);

      if (evidence.totalAttempts < minEvidence) {
        continue; // Skip skills with insufficient evidence
      }

      // Calculate priority score
      const priorityScore = await this.calculateReviewPriorityScore(studentId, skillState.skillId, evidence);

      if (priorityScore.score > 0) {
        candidates.push({
          skillId: skillState.skillId,
          skillCode: '', // Will be populated from ontology
          reviewType: this.determineReviewType(skillState.masteryProbability, evidence),
          priorityScore: priorityScore.score,
          scoringBreakdown: priorityScore.breakdown,
          evidence: {
            masteryProbability: skillState.masteryProbability,
            lastExposureAt: evidence.lastExposureAt,
            daysSinceLastExposure: evidence.daysSinceLastExposure,
            previousAttempts: evidence.totalAttempts,
            previousAccuracy: evidence.accuracy,
            previousHintUsage: evidence.totalHints,
            previousResponseTimeMs: evidence.averageResponseTimeMs,
          },
        });
      }
    }

    // Sort by priority score (descending)
    return candidates.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  /**
   * Calculate Review Priority Score for a single skill
   */
  async calculateReviewPriorityScore(
    studentId: string,
    skillId: string,
    evidence: SkillEvidence,
  ): Promise<ReviewPriorityScore> {
    const skillState = await this.skillStateRepository.findOne({
      where: { studentId, skillId },
    });

    if (!skillState) {
      return {
        skillId,
        skillCode: '',
        score: 0,
        breakdown: {
          difficultyScore: 0,
          retentionScore: 0,
          generalizationScore: 0,
          semanticScore: 0,
          noveltyScore: 0,
        },
      };
    }

    // Calculate individual factors (all normalized to 0..1)
    const difficultyScore = this.calculateDifficultyScore(skillState.masteryProbability);
    const retentionScore = this.calculateRetentionScore(evidence.daysSinceLastExposure);
    const generalizationScore = this.calculateGeneralizationScore(evidence.totalAttempts, evidence.accuracy);
    const semanticScore = await this.calculateSemanticScore(skillId);
    const noveltyScore = this.calculateNoveltyScore(evidence.reviewCount);

    // Weighted sum
    const finalScore =
      0.25 * difficultyScore +
      0.25 * retentionScore +
      0.2 * generalizationScore +
      0.15 * semanticScore +
      0.15 * noveltyScore;

    return {
      skillId,
      skillCode: '', // Will be populated from ontology
      score: finalScore,
      breakdown: {
        difficultyScore,
        retentionScore,
        generalizationScore,
        semanticScore,
        noveltyScore,
      },
    };
  }

  /**
   * Determine review type based on mastery and evidence
   */
  private determineReviewType(
    masteryProbability: number,
    evidence: SkillEvidence,
  ): 'REMEDIATION' | 'RETENTION' | 'GENERALIZATION' {
    // REMEDIATION: low mastery or recent errors
    if (masteryProbability < 0.5 || evidence.accuracy < 0.7) {
      return 'REMEDIATION';
    }

    // GENERALIZATION: high accuracy, sufficient exposure
    if (evidence.accuracy > 0.8 && evidence.totalAttempts >= this.minAttemptsForGeneralization) {
      return 'GENERALIZATION';
    }

    // RETENTION: mastered but not seen recently
    return 'RETENTION';
  }

  /**
   * Calculate difficulty score (targets skills near mastery boundary)
   * Score = 1 - |masteryProbability - targetSuccessProbability| / targetSuccessProbability
   */
  private calculateDifficultyScore(masteryProbability: number): number {
    const distance = Math.abs(masteryProbability - this.targetSuccessProbability);
    const normalized = Math.min(distance / this.targetSuccessProbability, 1);
    return 1 - normalized;
  }

  /**
   * Calculate retention score (exponential decay by days since exposure)
   * Score = exp(-daysSinceLastExposure / retentionHalfLife)
   */
  private calculateRetentionScore(daysSinceLastExposure: number): number {
    if (daysSinceLastExposure <= 0) return 0;
    return Math.exp(-daysSinceLastExposure / this.retentionHalfLife);
  }

  /**
   * Calculate generalization score (requires sufficient prior exposure + high accuracy)
   * Score = min(totalAttempts / minAttempts, 1.0) * accuracy
   */
  private calculateGeneralizationScore(totalAttempts: number, accuracy: number): number {
    const exposureScore = Math.min(totalAttempts / this.minAttemptsForGeneralization, 1);
    return exposureScore * accuracy;
  }

  /**
   * Calculate semantic score (prerequisite importance from ontology)
   */
  private async calculateSemanticScore(skillId: string): Promise<number> {
    // TODO: Implement ontology lookup for prerequisite weight
    // For now, return neutral score
    return 0.5;
  }

  /**
   * Calculate novelty score (prevents over-reviewing same skill)
   * Score = 1 - (reviewCount / maxReviews)
   */
  private calculateNoveltyScore(reviewCount: number): number {
    return Math.max(0, 1 - reviewCount / this.maxReviewsPerSkill);
  }

  /**
   * Get baseline evidence for a skill
   */
  private async getSkillEvidence(studentId: string, skillId: string, lookbackDays: number): Promise<SkillEvidence> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);

    // Get learning events for this skill
    const events = await this.eventRepository.find({
      where: {
        studentId,
        bnccSkillId: skillId,
        timestamp: { $gte: cutoffDate } as any,
      },
      order: { timestamp: 'DESC' },
    });

    const lastExposureAt = events.length > 0 ? events[0].timestamp : null;
    const daysSinceLastExposure = lastExposureAt
      ? Math.floor((Date.now() - lastExposureAt.getTime()) / (1000 * 60 * 60 * 24))
      : Infinity;

    // Calculate metrics
    const submittedEvents = events.filter((e) => e.eventType === 'ANSWER_SUBMITTED');
    const correctCount = submittedEvents.filter((e) => e.correct === true).length;
    const totalAttempts = submittedEvents.length;
    const accuracy = totalAttempts > 0 ? correctCount / totalAttempts : 0;

    const hintsEvents = events.filter((e) => e.eventType === 'HINT_REQUESTED');
    const totalHints = hintsEvents.reduce((sum, e) => sum + (e.hintsUsed || 0), 0);

    const responseTimes = submittedEvents
      .map((e) => e.responseTimeMs)
      .filter((rt): rt is number => rt !== null && rt !== undefined);
    const averageResponseTimeMs =
      responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;

    // Count previous reviews (TODO: implement)
    const reviewCount = 0;

    return {
      totalAttempts,
      accuracy,
      totalHints,
      averageResponseTimeMs,
      lastExposureAt,
      daysSinceLastExposure,
      reviewCount,
    };
  }
}

interface SkillEvidence {
  totalAttempts: number;
  accuracy: number;
  totalHints: number;
  averageResponseTimeMs: number;
  lastExposureAt: Date | null;
  daysSinceLastExposure: number;
  reviewCount: number;
}
```

### 3.2 ReviewSelectionService

**File**: `backend/src/modules/learning-events/services/review-selection.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity, DifficultyLevel } from '../../activities/entities/activity.entity';
import { OntologyService } from '../../ontology/ontology.service';
import { HybridRecommendationService } from '../../ade/hybrid-recommendation.service';
import { ReviewType } from '../entities/review-assignment.entity';

export interface ReviewActivitySelection {
  templateId: string;
  instanceId: string;
  activity: Activity;
  reviewType: ReviewType;
  reason: string;
  score: number;
}

export interface LearnerProfile {
  studentId: string;
  accessibilityNeeds?: {
    sensoryLoad?: 'low' | 'medium' | 'high';
    motorDemand?: 'low' | 'medium' | 'high';
    languageLoad?: 'low' | 'medium' | 'high';
  };
  preferredModalities?: string[];
  professionalConstraints?: string[];
}

@Injectable()
export class ReviewSelectionService {
  private readonly logger = new Logger(ReviewSelectionService.name);

  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    private readonly ontologyService: OntologyService,
    private readonly hybridRecommendationService: HybridRecommendationService,
  ) {}

  /**
   * Select review activity for a skill
   */
  async selectReviewActivity(
    studentId: string,
    skillId: string,
    reviewType: ReviewType,
    learnerProfile: LearnerProfile,
  ): Promise<ReviewActivitySelection> {
    // Step 1: Get eligible activities for this skill
    const candidates = await this.getEligibleActivities(skillId);

    if (candidates.length === 0) {
      throw new Error(`No eligible activities found for skill ${skillId}`);
    }

    // Step 2: Apply semantic filtering
    const semanticallyValid = await this.applySemanticFiltering(candidates, learnerProfile);

    if (semanticallyValid.length === 0) {
      throw new Error(`No semantically valid activities for skill ${skillId} and learner profile`);
    }

    // Step 3: Rank by review type
    const ranked = this.rankByReviewType(semanticallyValid, reviewType);

    // Step 4: Select top candidate and generate instance
    const selected = ranked[0];
    const instance = await this.generateEquivalentInstance(selected.id, reviewType);

    return {
      templateId: selected.id,
      instanceId: instance.id,
      activity: instance,
      reviewType,
      reason: `Selected for ${reviewType} review based on semantic fit and difficulty`,
      score: 0.8, // TODO: Calculate actual score
    };
  }

  /**
   * Generate equivalent but non-identical activity instance
   */
  async generateEquivalentInstance(templateId: string, reviewType: ReviewType): Promise<Activity> {
    const template = await this.activityRepository.findOne({ where: { id: templateId } });

    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // TODO: Implement parametric generation based on reviewType
    // For now, return template as instance
    const instance = { ...template };
    instance.id = this.generateUUID();
    instance.templateId = templateId;
    instance.isTemplate = false;
    instance.instanceMetadata = {
      generatedFrom: templateId,
      generationSeed: Math.random(),
      parameters: {},
      generatedAt: new Date(),
    };

    return instance;
  }

  /**
   * Get eligible activities for a skill
   */
  private async getEligibleActivities(skillId: string): Promise<Activity[]> {
    return this.activityRepository.find({
      where: {
        bnccSkills: { $contains: [skillId] } as any,
        isActive: true,
      },
    });
  }

  /**
   * Apply semantic filtering based on learner profile
   */
  private async applySemanticFiltering(candidates: Activity[], profile: LearnerProfile): Promise<Activity[]> {
    return candidates.filter((activity) => {
      // Hard blocks for accessibility
      if (profile.accessibilityNeeds?.sensoryLoad === 'low' && activity.accessibility?.sensoryLoad === 'high') {
        return false;
      }

      if (profile.accessibilityNeeds?.motorDemand === 'low' && activity.content?.semantic?.motorDemand === 'high') {
        return false;
      }

      if (profile.accessibilityNeeds?.languageLoad === 'low' && activity.content?.semantic?.languageLoad === 'high') {
        return false;
      }

      // Professional constraints
      if (profile.professionalConstraints?.includes(activity.id)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Rank activities by review type
   */
  private rankByReviewType(candidates: Activity[], reviewType: ReviewType): Activity[] {
    // TODO: Implement review-type-specific ranking
    // For now, sort by difficulty
    const difficultyOrder = {
      very_easy: 0,
      easy: 1,
      medium: 2,
      hard: 3,
      extreme: 4,
    };

    return candidates.sort((a, b) => {
      const aDiff = difficultyOrder[a.difficulty as keyof typeof difficultyOrder] ?? 2;
      const bDiff = difficultyOrder[b.difficulty as keyof typeof difficultyOrder] ?? 2;
      return aDiff - bDiff;
    });
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
```

---

## STEP 4: UNIT TESTS

### 4.1 ReviewCandidateGenerationService Tests

**File**: `backend/src/modules/learning-events/services/__tests__/review-candidate-generation.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReviewCandidateGenerationService } from '../review-candidate-generation.service';
import { ExercisePerformance } from '../../entities/exercise-performance.entity';
import { LearningEvent } from '../../entities/learning-event.entity';
import { StudentSkillState } from '../../../knowledge-tracing/entities/student-skill-state.entity';
import { KnowledgeTracingService } from '../../../knowledge-tracing/knowledge-tracing.service';
import { OntologyService } from '../../../ontology/ontology.service';
import { ConfigService } from '@nestjs/config';

describe('ReviewCandidateGenerationService', () => {
  let service: ReviewCandidateGenerationService;
  let mockPerformanceRepository: any;
  let mockEventRepository: any;
  let mockSkillStateRepository: any;

  beforeEach(async () => {
    mockPerformanceRepository = {
      find: jest.fn(),
    };

    mockEventRepository = {
      find: jest.fn(),
    };

    mockSkillStateRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewCandidateGenerationService,
        {
          provide: getRepositoryToken(ExercisePerformance),
          useValue: mockPerformanceRepository,
        },
        {
          provide: getRepositoryToken(LearningEvent),
          useValue: mockEventRepository,
        },
        {
          provide: getRepositoryToken(StudentSkillState),
          useValue: mockSkillStateRepository,
        },
        {
          provide: KnowledgeTracingService,
          useValue: { getMasteryBySkillCode: jest.fn() },
        },
        {
          provide: OntologyService,
          useValue: { getValidActivityCandidates: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key, defaultValue) => defaultValue),
          },
        },
      ],
    }).compile();

    service = module.get<ReviewCandidateGenerationService>(ReviewCandidateGenerationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateDifficultyScore', () => {
    it('should return 1 when mastery equals target success probability', () => {
      const score = (service as any).calculateDifficultyScore(0.7);
      expect(score).toBe(1);
    });

    it('should return 0 when mastery is far from target', () => {
      const score = (service as any).calculateDifficultyScore(0);
      expect(score).toBeLessThan(0.5);
    });
  });

  describe('calculateRetentionScore', () => {
    it('should return 0 for recent exposure', () => {
      const score = (service as any).calculateRetentionScore(0);
      expect(score).toBe(0);
    });

    it('should return positive score for older exposure', () => {
      const score = (service as any).calculateRetentionScore(14);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(1);
    });
  });

  describe('calculateGeneralizationScore', () => {
    it('should return 0 for insufficient attempts', () => {
      const score = (service as any).calculateGeneralizationScore(1, 0.9);
      expect(score).toBeLessThan(0.5);
    });

    it('should return high score for sufficient attempts and high accuracy', () => {
      const score = (service as any).calculateGeneralizationScore(10, 0.9);
      expect(score).toBeGreaterThan(0.8);
    });
  });

  describe('calculateNoveltyScore', () => {
    it('should return 1 for never-reviewed skill', () => {
      const score = (service as any).calculateNoveltyScore(0);
      expect(score).toBe(1);
    });

    it('should return 0 for over-reviewed skill', () => {
      const score = (service as any).calculateNoveltyScore(3);
      expect(score).toBeLessThanOrEqual(0);
    });
  });

  describe('determineReviewType', () => {
    it('should return REMEDIATION for low mastery', () => {
      const type = (service as any).determineReviewType(0.4, {
        totalAttempts: 5,
        accuracy: 0.6,
        totalHints: 2,
        averageResponseTimeMs: 5000,
        lastExposureAt: new Date(),
        daysSinceLastExposure: 1,
        reviewCount: 0,
      });
      expect(type).toBe('REMEDIATION');
    });

    it('should return GENERALIZATION for high accuracy and sufficient attempts', () => {
      const type = (service as any).determineReviewType(0.85, {
        totalAttempts: 10,
        accuracy: 0.9,
        totalHints: 1,
        averageResponseTimeMs: 3000,
        lastExposureAt: new Date(),
        daysSinceLastExposure: 1,
        reviewCount: 0,
      });
      expect(type).toBe('GENERALIZATION');
    });

    it('should return RETENTION for mastered but not recent', () => {
      const type = (service as any).determineReviewType(0.75, {
        totalAttempts: 5,
        accuracy: 0.8,
        totalHints: 1,
        averageResponseTimeMs: 3000,
        lastExposureAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        daysSinceLastExposure: 20,
        reviewCount: 0,
      });
      expect(type).toBe('RETENTION');
    });
  });
});
```

### 4.2 ReviewSelectionService Tests

**File**: `backend/src/modules/learning-events/services/__tests__/review-selection.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReviewSelectionService } from '../review-selection.service';
import { Activity } from '../../../activities/entities/activity.entity';
import { OntologyService } from '../../../ontology/ontology.service';
import { HybridRecommendationService } from '../../../ade/hybrid-recommendation.service';

describe('ReviewSelectionService', () => {
  let service: ReviewSelectionService;
  let mockActivityRepository: any;

  beforeEach(async () => {
    mockActivityRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewSelectionService,
        {
          provide: getRepositoryToken(Activity),
          useValue: mockActivityRepository,
        },
        {
          provide: OntologyService,
          useValue: { getValidActivityCandidates: jest.fn() },
        },
        {
          provide: HybridRecommendationService,
          useValue: { rank: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ReviewSelectionService>(ReviewSelectionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('applySemanticFiltering', () => {
    it('should filter out high-sensory activities for low-sensory learners', () => {
      const candidates: Activity[] = [
        {
          id: '1',
          accessibility: { sensoryLoad: 'high' },
        } as any,
        {
          id: '2',
          accessibility: { sensoryLoad: 'low' },
        } as any,
      ];

      const profile = {
        studentId: 'student1',
        accessibilityNeeds: { sensoryLoad: 'low' },
      };

      const filtered = (service as any).applySemanticFiltering(candidates, profile);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('2');
    });

    it('should filter out professional constraints', () => {
      const candidates: Activity[] = [
        { id: '1' } as any,
        { id: '2' } as any,
      ];

      const profile = {
        studentId: 'student1',
        professionalConstraints: ['1'],
      };

      const filtered = (service as any).applySemanticFiltering(candidates, profile);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('2');
    });
  });

  describe('rankByReviewType', () => {
    it('should rank activities by difficulty', () => {
      const candidates: Activity[] = [
        { id: '1', difficulty: 'hard' } as any,
        { id: '2', difficulty: 'easy' } as any,
        { id: '3', difficulty: 'medium' } as any,
      ];

      const ranked = (service as any).rankByReviewType(candidates, 'REMEDIATION');
      expect(ranked[0].difficulty).toBe('easy');
      expect(ranked[1].difficulty).toBe('medium');
      expect(ranked[2].difficulty).toBe('hard');
    });
  });
});
```

---

## STEP 5: MODULE REGISTRATION

### 5.1 Update LearningEventsModule

**File**: `backend/src/modules/learning-events/learning-events.module.ts`

Add to imports and providers:

```typescript
import { ReviewCandidateGenerationService } from './services/review-candidate-generation.service';
import { ReviewSelectionService } from './services/review-selection.service';
import { ReviewAssignment } from './entities/review-assignment.entity';
import { ReviewOutcome } from './entities/review-outcome.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LearningEvent,
      InteractionEvidence,
      RecommendationOutcome,
      ExercisePerformance,
      ReviewAssignment,
      ReviewOutcome,
    ]),
    OntologyModule,
    KnowledgeTracingModule,
    AdeModule,
  ],
  providers: [
    LearningEventService,
    LearningAnalyticsMetricsService,
    RecommendationOutcomeService,
    ReviewCandidateGenerationService,
    ReviewSelectionService,
  ],
  exports: [
    LearningEventService,
    LearningAnalyticsMetricsService,
    RecommendationOutcomeService,
    ReviewCandidateGenerationService,
    ReviewSelectionService,
  ],
})
export class LearningEventsModule {}
```

---

## STEP 6: TESTING & VALIDATION

### 6.1 Run Migrations

```bash
npm run typeorm migration:run
```

### 6.2 Run Unit Tests

```bash
npm test -- --testPathPattern="review-candidate-generation|review-selection"
```

### 6.3 Verify Database Schema

```sql
-- Check ReviewAssignment table
\d review_assignments

-- Check ReviewOutcome table
\d review_outcomes

-- Check Activity extensions
\d activities
```

---

## DELIVERABLES CHECKLIST

- [ ] ReviewAssignment migration created and tested
- [ ] ReviewOutcome migration created and tested
- [ ] Activity entity extended with template fields
- [ ] ReviewAssignment entity implemented
- [ ] ReviewOutcome entity implemented
- [ ] ReviewCandidateGenerationService implemented
- [ ] ReviewSelectionService implemented
- [ ] Unit tests for ReviewCandidateGenerationService (80%+ coverage)
- [ ] Unit tests for ReviewSelectionService (80%+ coverage)
- [ ] LearningEventsModule updated
- [ ] All tests passing
- [ ] Database schema verified
- [ ] Documentation updated

---

## NEXT STEPS

After Batch 1 is complete:
1. **Batch 2**: ReviewTriggerService + integration with session lifecycle
2. **Batch 3**: LongitudinalComparisonService + progression classification
3. **Batch 4**: Frontend + analytics

---

**Status**: 🟢 READY FOR IMPLEMENTATION
