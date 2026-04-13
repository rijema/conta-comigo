import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ActivityAttempt } from './activity-attempt.entity';

export enum ActivityType {
  VISUAL_PUZZLE = 'visual_puzzle',
  QUIZ = 'quiz',
  VIDEO_QUESTION = 'video_question',
  YES_NO = 'yes_no',
  COUNTING = 'counting',
  DRAG_DROP = 'drag_drop',
}

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ActivityType })
  type: ActivityType;

  @Column({ type: 'enum', enum: DifficultyLevel, default: DifficultyLevel.EASY })
  difficulty: DifficultyLevel;

  // BNCC skill codes e.g. "EF01MA01", "EF02MA05"
  @Column({ type: 'jsonb', default: [] })
  bnccSkills: string[];

  // Which ontology modalities this activity targets
  @Column({ type: 'jsonb', default: [] })
  targetModalities: string[]; // ['visual', 'logical', 'sensory']

  // The actual content: questions, options, correct answers
  @Column({ type: 'jsonb' })
  content: {
    instructions: string;
    instructionsPt: string;
    items?: any[];
    imageUrl?: string;
    audioUrl?: string;
    videoUrl?: string;
    correctAnswer?: any;
    options?: any[];
    timeLimit?: number; // seconds
  };

  // Accessibility metadata
  @Column({ type: 'jsonb', nullable: true })
  accessibility: {
    hasAudio?: boolean;
    hasVisual?: boolean;
    hasAnimation?: boolean;
    sensoryLoad?: 'low' | 'medium' | 'high';
  };

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  pointsReward: number;

  @Column({ nullable: true })
  prerequisiteSkillCode: string;

  @OneToMany(() => ActivityAttempt, (a) => a.activity)
  attempts: ActivityAttempt[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}