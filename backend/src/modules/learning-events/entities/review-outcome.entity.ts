import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

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
  accuracyDeltaNormalized: number; // [-1, +1]
  responseTimeDeltaNormalized: number; // [-1, +1], positive = faster
  attemptsDeltaNormalized: number; // [-1, +1]
  hintsDeltaNormalized: number; // [-1, +1], positive = fewer hints
  masteryDeltaNormalized: number; // [-1, +1]
}

export interface LongitudinalMetadata {
  instanceComparison: 'EXACT_REPEAT' | 'EQUIVALENT_INSTANCE' | 'DIFFICULTY_PROGRESSION' | 'DIFFICULTY_SUPPORT';
  difficultyComparison: 'same' | 'harder' | 'easier';
  conceptCoverage: string[];
  conceptsNewInReview: string[];
  daysSinceBaseline: number;
  sameTemplate: boolean;
  sameInstance: boolean;
  reviewType: 'REMEDIATION' | 'RETENTION' | 'GENERALIZATION';
}

@Entity('review_outcomes')
@Index(['reviewAssignmentId'])
@Index(['studentId', 'skillId', 'createdAt'])
export class ReviewOutcome {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  reviewAssignmentId: string;

  @Column({ type: 'uuid' })
  studentId: string;

  @Column({ type: 'uuid' })
  skillId: string;

  // Review interaction evidence
  @Column({ type: 'uuid' })
  reviewInteractionId: string;

  @Column({ type: 'uuid' })
  reviewRecommendationId: string;

  // RAW LONGITUDINAL EVIDENCE (primary research data)
  @Column({ type: 'jsonb' })
  baselineMetrics: PerformanceMetrics;

  @Column({ type: 'jsonb' })
  reviewMetrics: PerformanceMetrics;

  // Raw deltas (review - baseline)
  @Column({ type: 'jsonb' })
  deltas: PerformanceDelta;

  // Normalized deltas (for comparison across scales, [-1, +1])
  @Column({ type: 'jsonb' })
  normalizedDeltas: NormalizedDeltas;

  // Conservative classification (based on multiple signals)
  @Column({ type: 'enum', enum: ProgressionClassification })
  progressionClassification: ProgressionClassification;

  // Evidence signals (recorded for research)
  @Column({ type: 'varchar', array: true })
  evidenceSignals: string[];

  // Classification reasoning (for auditability)
  @Column({ type: 'text' })
  classificationReason: string;

  // Longitudinal context metadata
  @Column({ type: 'jsonb' })
  metadata: LongitudinalMetadata;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
