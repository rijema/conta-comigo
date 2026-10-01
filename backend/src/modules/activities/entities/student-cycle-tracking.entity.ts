import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('student_cycle_tracking')
@Index(['student_id', 'island_id', 'cycle_number'], { unique: true })
@Index(['student_id', 'status'])
export class StudentCycleTracking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  student_id: string;

  @Column({ type: 'uuid' })
  island_id: string;

  @Column({ type: 'int' })
  cycle_number: number;

  @Column({ type: 'varchar' })
  skill_focus: string;

  @Column({ type: 'int', default: 1 })
  current_position: number;

  @Column({ type: 'varchar', default: 'active' })
  status: 'active' | 'completed' | 'paused' | 'abandoned';

  @Column({ type: 'int', default: 0 })
  exercises_completed_count: number;

  @Column({ type: 'int', default: 10 })
  total_exercises: number;

  @CreateDateColumn()
  started_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
