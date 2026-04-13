import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('analytics_snapshots')
export class AnalyticsSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  sessionId: string;

  @Column({ type: 'float', default: 0 })
  overallAccuracy: number;

  @Column({ type: 'float', default: 0 })
  engagementIndex: number;

  @Column({ type: 'float', default: 0 })
  averageTimePerActivity: number;

  @Column({ default: 0 })
  totalActivitiesCompleted: number;

  @Column({ default: 0 })
  totalCorrect: number;

  @Column({ type: 'jsonb', nullable: true })
  skillMasterySnapshot: Record<string, number>;

  @Column({ type: 'jsonb', nullable: true })
  bnccCoverage: Record<string, boolean>;

  @Column({ type: 'jsonb', nullable: true })
  behavioralPatterns: {
    avgHintsPerActivity?: number;
    avgClicksPerActivity?: number;
    pauseFrequency?: number;
    preferredTimeOfDay?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  rawEventData: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}