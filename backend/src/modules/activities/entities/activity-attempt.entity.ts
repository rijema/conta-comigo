import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Activity } from './activity.entity';

@Entity('activity_attempts')
export class ActivityAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => Activity, (a) => a.attempts, { eager: true })
  @JoinColumn()
  activity: Activity;

  @Column()
  activityId: string;

  @Column({ nullable: true })
  sessionId: string;

  @Column({ default: false })
  isCorrect: boolean;

  @Column({ type: 'float', default: 0 })
  score: number; // 0..1

  @Column({ nullable: true })
  timeSpentSeconds: number;

  @Column({ nullable: true })
  hintsUsed: number;

  // Raw interaction signals for ML
  @Column({ type: 'jsonb', nullable: true })
  interactionSignals: {
    clickCount?: number;
    backtrackCount?: number;
    pauseCount?: number;
    totalFocusTime?: number;
    answerChanges?: number;
    firstAnswerTime?: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  adeDecisionContext: {
    decisionId?: string;
    recommendedModality?: string;
    recommendedDifficulty?: string;
  };

  @CreateDateColumn()
  createdAt: Date;
}