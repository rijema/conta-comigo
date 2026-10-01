import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Activity } from './activity.entity';

@Entity('exercise_parameters')
export class ExerciseParameters {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  activity_id: string;

  @ManyToOne(() => Activity, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;

  // BNCC Skills
  @Column({ type: 'varchar', nullable: true })
  primary_skill: string;

  @Column({ type: 'text', nullable: true })
  secondary_skills: string;

  // Year Level Targeting
  @Column({ type: 'int', nullable: true })
  target_year_min: number;

  @Column({ type: 'int', nullable: true })
  target_year_max: number;

  @Column({ type: 'int', nullable: true })
  optimal_year: number;

  // TEA Support Level Targeting
  @Column({ type: 'int', nullable: true })
  tea_support_min: number;

  @Column({ type: 'int', nullable: true })
  tea_support_max: number;

  @Column({ type: 'int', nullable: true })
  optimal_tea_support: number;

  // Modality Intensities (0.0-5.0)
  @Column({ type: 'decimal', precision: 3, scale: 1, default: 3.0 })
  visual_intensity: number;

  @Column({ type: 'decimal', precision: 3, scale: 1, default: 2.0 })
  auditory_intensity: number;

  @Column({ type: 'decimal', precision: 3, scale: 1, default: 3.5 })
  kinesthetic_intensity: number;

  // Complexity & Difficulty
  @Column({ type: 'int', default: 50 })
  complexity_score: number;

  @Column({ type: 'int', nullable: true })
  time_limit_seconds: number;

  @Column({ type: 'varchar', default: 'medium' })
  scaffolding_level: 'high' | 'medium' | 'low';

  // Exercise Classification
  @Column({ type: 'varchar', default: 'minigame' })
  exercise_type: 'minigame' | 'drag_drop' | 'multiple_choice' | 'free_response';

  @Column({ type: 'varchar', nullable: true })
  minigame_name: string;

  // Performance Metrics
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.7 })
  engagement_score: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.65 })
  success_rate: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
