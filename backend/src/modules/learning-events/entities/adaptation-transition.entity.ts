import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('adaptation_transitions')
export class AdaptationTransition {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) studentId: string;
  @Column() sessionId: string;
  @Column({ type: 'uuid', unique: true }) previousRecommendationId: string;
  @Column({ type: 'uuid' }) previousActivityId: string;
  @Column({ type: 'uuid', unique: true }) triggerEventId: string;
  @Column() triggerType: string;
  @Column({ default: false }) changeRequested: boolean;
  @Column({ type: 'uuid', nullable: true }) replacementRecommendationId: string | null;
  @Column({ type: 'uuid', nullable: true }) replacementActivityId: string | null;
  @Column({ type: 'boolean', nullable: true }) sameBNCCSkill: boolean | null;
  @Column({ type: 'boolean', nullable: true }) sameMathematicalConcept: boolean | null;
  @Column({ type: 'boolean', nullable: true }) interactionTypeChanged: boolean | null;
  @Column({ type: 'boolean', nullable: true }) representationChanged: boolean | null;
  @Column({ type: 'double precision', nullable: true }) motorDemandDelta: number | null;
  @Column({ type: 'double precision', nullable: true }) sensoryLoadDelta: number | null;
  @Column({ type: 'double precision', nullable: true }) languageLoadDelta: number | null;
  @Column({ type: 'double precision', nullable: true }) scaffoldingDelta: number | null;
  @Column({ type: 'double precision', nullable: true }) difficultyDelta: number | null;
  @CreateDateColumn() createdAt: Date;
}
