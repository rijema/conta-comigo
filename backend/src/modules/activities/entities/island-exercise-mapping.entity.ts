import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('island_exercises_mapping')
@Index(['islandId'])
export class IslandExerciseMapping {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  islandId: string;

  @Column({ length: 100 })
  islandName: string;

  @Column({ length: 100 })
  topic: string;

  @Column({ type: 'jsonb' })
  bnccSkills: string[];

  @Column({ type: 'integer' })
  exerciseCount: number;

  @Column({ type: 'jsonb' })
  exerciseTitles: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
