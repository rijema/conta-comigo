import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import type { SemanticFilteringTrace } from '../../ontology/semantic-runtime.types';
import type { HybridRankingResult } from '../hybrid-recommendation.service';

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
    legacyProceduralSignals?: string[];
    rulesFired: string[];
    mlPredictions: Record<string, any>;
    finalReason: string;
    confidence: number;
    semanticFiltering?: SemanticFilteringTrace;
  };

  @Column({ type: 'jsonb', nullable: true })
  inputSnapshot: Record<string, any>;

  @Column({ type: 'uuid', nullable: true })
  selectedActivityId?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  hybridRanking?: HybridRankingResult | null;

  @Column({ type: 'varchar', nullable: true })
  decisionSource?: 'HYBRID_RANKING' | 'LEGACY_FALLBACK' | null;

  @Column({ default: false })
  fallbackUsed?: boolean;

  @Column({ type: 'text', nullable: true })
  fallbackReason?: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
