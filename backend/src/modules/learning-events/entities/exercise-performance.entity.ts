import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Activity } from '../../activities/entities/activity.entity';

@Entity('exercise_performance')
@Index(['userId', 'activityId'])
@Index(['userId', 'islandId'])
@Index(['userId', 'createdAt'])
export class ExercisePerformance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column()
  activityId: string;

  @ManyToOne(() => Activity, { onDelete: 'CASCADE' })
  @JoinColumn()
  activity: Activity;

  @Column({ nullable: true })
  islandId: string;

  @Column({ nullable: true })
  sessionId: string;

  @Column({ default: 1 })
  attemptNumber: number;

  @Column({ default: false })
  isCorrect: boolean;

  @Column({ type: 'float', default: 0 })
  score: number;

  @Column({ type: 'integer', nullable: true })
  responseTimeMs: number;

  @Column({ type: 'integer', default: 0 })
  hintsUsed: number;

  @Column({ type: 'integer', default: 0 })
  tutorialOpenedCount: number;

  @Column({ type: 'integer', default: 0 })
  instructionReplayCount: number;

  @Column({ type: 'boolean', default: false })
  skipped: boolean;

  @Column({ type: 'integer', nullable: true })
  timeBeforeSkipMs: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    difficultyAttempt?: string;
    modality?: string;
    conceptsTargeted?: string[];
    bnccSkills?: string[];
    interactionSignals?: Record<string, any>;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
