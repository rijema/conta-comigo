import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum LearningEventType {
  SESSION_STARTED = 'SESSION_STARTED',
  SESSION_COMPLETED = 'SESSION_COMPLETED',
  ACTIVITY_PRESENTED = 'ACTIVITY_PRESENTED',
  ACTIVITY_STARTED = 'ACTIVITY_STARTED',
  ANSWER_SUBMITTED = 'ANSWER_SUBMITTED',
  ACTIVITY_COMPLETED = 'ACTIVITY_COMPLETED',
  ACTIVITY_SKIPPED = 'ACTIVITY_SKIPPED',
  HINT_REQUESTED = 'HINT_REQUESTED',
  TUTORIAL_OPENED = 'TUTORIAL_OPENED',
  INSTRUCTION_REPLAYED = 'INSTRUCTION_REPLAYED',
  RECOMMENDATION_GENERATED = 'RECOMMENDATION_GENERATED',
  RECOMMENDATION_PRESENTED = 'RECOMMENDATION_PRESENTED',
  RECOMMENDATION_COMPLETED = 'RECOMMENDATION_COMPLETED',
  DIFFICULTY_ADJUSTED = 'DIFFICULTY_ADJUSTED',
  TITIA_INTERACTION = 'TITIA_INTERACTION',
}

@Entity('learning_events')
export class LearningEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  studentId: string;

  @Column()
  sessionId: string;

  @Column({ type: 'enum', enum: LearningEventType, enumName: 'learning_event_type_enum' })
  eventType: LearningEventType;

  @Column({ type: 'timestamptz' })
  timestamp: Date;

  @Column({ type: 'uuid', nullable: true })
  activityId: string | null;

  @Column({ type: 'uuid', nullable: true })
  bnccSkillId: string | null;

  @Column({ type: 'integer', nullable: true })
  attempt: number | null;

  @Column({ type: 'integer', nullable: true })
  responseTimeMs: number | null;

  @Column({ type: 'boolean', nullable: true })
  correct: boolean | null;

  @Column({ type: 'integer', nullable: true })
  hintsUsed: number | null;

  @Column({ type: 'varchar', nullable: true })
  recommendationId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;
}
