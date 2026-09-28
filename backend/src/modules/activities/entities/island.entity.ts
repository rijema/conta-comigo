import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('islands')
@Index(['islandId'])
export class Island {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true })
  islandId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 100 })
  theme: string;

  @Column({ type: 'jsonb', default: [] })
  arasaacPictogramIds: string[];

  @Column({ type: 'jsonb', default: [] })
  bnccSkills: string[];

  @Column({ type: 'integer' })
  sequenceOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
