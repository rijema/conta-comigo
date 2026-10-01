import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('cycle_exercise_assignment')
@Index(['cycle_tracking_id', 'position_in_cycle'])
export class CycleExerciseAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  cycle_tracking_id: string;

  @Column({ type: 'uuid' })
  activity_id: string;

  @Column({ type: 'int' })
  position_in_cycle: number;

  @Column({ type: 'decimal', precision: 4, scale: 3, nullable: true })
  match_score: number;

  @Column({ type: 'boolean', default: false })
  is_completed: boolean;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  student_score: number;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
