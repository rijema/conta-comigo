import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Island } from './island.entity';
import { Activity } from './activity.entity';

@Entity('island_activity_mappings')
@Index(['islandId'])
@Index(['activityId'])
export class IslandActivityMapping {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  islandId: string;

  @Column({ type: 'uuid' })
  activityId: string;

  @Column({ type: 'integer' })
  sequenceInIsland: number;

  @Column({ length: 20 })
  difficulty: string;

  @Column({ length: 50 })
  modality: string;

  @Column({ length: 255, nullable: true })
  customTitle: string;

  @Column({ type: 'text', nullable: true })
  customInstructions: string;

  @Column({ type: 'jsonb', nullable: true })
  scaffolding: Record<string, any>;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Island, { eager: false })
  @JoinColumn({ name: 'islandId', referencedColumnName: 'islandId' })
  island: Island;

  @ManyToOne(() => Activity, { eager: false })
  @JoinColumn({ name: 'activityId' })
  activity: Activity;
}
