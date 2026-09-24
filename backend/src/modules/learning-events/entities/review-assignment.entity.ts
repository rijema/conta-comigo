import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ReviewType {
  REMEDIATION = 'REMEDIATION',
  RETENTION = 'RETENTION',
  GENERALIZATION = 'GENERALIZATION',
}

export interface ScoringConfiguration {
  version: string; // e.g., "review-priority-score/1.0.0"
  weights: Record<string, number>; // w_error, w_attempts, w_help, etc.
  thresholds: Record<string, number>; // slowThreshold, maxExpectedAttempts, etc.
  timestamp: Date; // when this configuration was active
}

export interface ScoringBreakdown {
  errorScore?: number;
  attemptScore?: number;
  helpScore?: number;
  engagementScore?: number;
  responseTimeScore?: number;
  completionScore?: number;
  masteryScore?: number;
  recencyScore?: number;
  normalizedFactors: Record<string, number>;
}

export interface BaselineState {
  masteryBefore: number;
  difficultyBefore: string;
  lastExposureAt: Date | null;
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

  @Column({ type: 'uuid' })
  skillId: string;

  @Column({ type: 'enum', enum: ReviewType })
  reviewType: ReviewType;

  // Baseline evidence that triggered review (reconstructable)
  @Column({ type: 'uuid', array: true })
  sourceInteractionIds: string[];

  @Column({ type: 'uuid', array: true })
  sourceRecommendationIds: string[];

  // Activity selected for review
  @Column({ type: 'uuid' })
  selectedActivityTemplateId: string;

  @Column({ type: 'uuid' })
  selectedActivityInstanceId: string;

  // Selection metadata
  @Column({ type: 'varchar' })
  reason: string;

  @Column({ type: 'float' })
  priorityScore: number;

  // Scoring configuration (versioned for reproducibility)
  @Column({ type: 'jsonb' })
  scoringConfiguration: ScoringConfiguration;

  // Scoring breakdown (all 8 behavioral factors)
  @Column({ type: 'jsonb' })
  scoringBreakdown: ScoringBreakdown;

  // Baseline state snapshot (reconstructable from sourceInteractionIds)
  @Column({ type: 'jsonb' })
  baselineState: BaselineState;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;
}
