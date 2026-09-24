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
  accuracy: number | null; // [RESEARCH]: Preserve null if unavailable
  averageResponseTimeMs: number | null; // [RESEARCH]: Preserve null if unavailable
  averageAttempts: number | null; // [RESEARCH]: Use comparable definition, preserve null
  hintsUsed: number | null; // [RESEARCH]: Use real observed hints, preserve null
  masteryProbability: number | null; // [RESEARCH]: Real BKT mastery, preserve null
  difficultyLevel: string | null; // [RESEARCH]: Real Activity difficulty, preserve null if unknown
}

export interface PerformanceDelta {
  accuracyDelta: number | null; // [RESEARCH]: Preserve null if baseline/review unavailable
  responseTimeDelta: number | null; // [RESEARCH]: Preserve null if unavailable
  attemptsDelta: number | null; // [RESEARCH]: Preserve null if not comparable
  hintsDelta: number | null; // [RESEARCH]: Preserve null if unavailable
  masteryDelta: number | null; // [RESEARCH]: Preserve null if baseline/review unavailable
}

export interface NormalizedDeltas {
  accuracyDeltaNormalized: number | null; // [-1, +1], [RESEARCH]: Preserve null if unavailable
  responseTimeDeltaNormalized: number | null; // [-1, +1], positive = faster, [RESEARCH]: Preserve null
  attemptsDeltaNormalized: number | null; // [-1, +1], [RESEARCH]: Preserve null if not comparable
  hintsDeltaNormalized: number | null; // [-1, +1], positive = fewer hints, [RESEARCH]: Preserve null
  masteryDeltaNormalized: number | null; // [-1, +1], [RESEARCH]: Preserve null if unavailable
}

export interface LongitudinalMetadata {
  instanceComparison: 'EXACT_REPEAT' | 'EQUIVALENT_INSTANCE' | 'DIFFICULTY_PROGRESSION' | 'DIFFICULTY_SUPPORT' | 'UNVERIFIED';
  difficultyComparison: 'same' | 'harder' | 'easier' | 'unknown';
  conceptCoverage: string[];
  conceptsNewInReview: string[];
  daysSinceBaseline: number | null;
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
