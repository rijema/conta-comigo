import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('interaction_evidence')
export class InteractionEvidence {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid', unique: true }) sourceEventId: string;
  @Column({ type: 'uuid' }) studentId: string;
  @Column() sessionId: string;
  @Column({ type: 'uuid' }) activityId: string;
  @Column({ type: 'uuid', nullable: true }) recommendationId: string | null;
  @Column() eventType: string;
  @Column({ type: 'jsonb', nullable: true }) interactionType: string[] | null;
  @Column({ type: 'jsonb', nullable: true }) representation: string[] | null;
  @Column({ type: 'varchar', nullable: true }) motorDemand: string | null;
  @Column({ type: 'varchar', nullable: true }) sensoryLoad: string | null;
  @Column({ type: 'varchar', nullable: true }) languageLoad: string | null;
  @Column({ type: 'varchar', nullable: true }) outcome: string | null;
  @Column({ type: 'timestamptz' }) timestamp: Date;
  @Column({ type: 'jsonb', nullable: true }) metadata: Record<string, number | boolean | null> | null;
}
