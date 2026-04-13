import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('ade_decisions')
export class AdeDecision {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  sessionId: string;

  @Column()
  recommendedDifficulty: string;

  @Column()
  recommendedModality: string;

  @Column({ nullable: true })
  recommendedActivityType: string;

  @Column({ nullable: true })
  recommendedBnccSkill: string;

  // XAI: explainability record
  @Column({ type: 'jsonb' })
  xaiLog: {
    ontologyInferences: string[];
    rulesFired: string[];
    mlPredictions: Record<string, any>;
    finalReason: string;
    confidence: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  inputSnapshot: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}