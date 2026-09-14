import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum RecommendationOutcomeStatus {
  PRESENTED = 'PRESENTED',
  STARTED = 'STARTED',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
  ABANDONED = 'ABANDONED',
}

@Entity('recommendation_outcomes')
export class RecommendationOutcome {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid', unique: true }) recommendationId: string;
  @Column({ type: 'uuid' }) studentId: string;
  @Column() sessionId: string;
  @Column({ type: 'uuid' }) activityId: string;
  @Column({ type: 'enum', enum: RecommendationOutcomeStatus, enumName: 'recommendation_outcome_status_enum' })
  status: RecommendationOutcomeStatus;
  @Column({ type: 'timestamptz', nullable: true }) presentedAt: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) startedAt: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) completedAt: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) skippedAt: Date | null;
  @Column({ type: 'integer', default: 0 }) attempts: number;
  @Column({ type: 'integer', default: 0 }) hintsUsed: number;
  @Column({ type: 'integer', default: 0 }) instructionReplays: number;
  @Column({ type: 'integer', nullable: true }) responseTimeMs: number | null;
  @Column({ type: 'boolean', nullable: true }) correct: boolean | null;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
