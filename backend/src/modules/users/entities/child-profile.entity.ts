Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('child_profiles')
export class ChildProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.childProfile)
  @JoinColumn()
  user: User;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  age: number;

  @Column({ nullable: true })
  schoolYear: number; // 1-5 (Anos Iniciais)

  @Column({ nullable: true })
  asdSupportLevel: string; // mild, moderate, strong

  // Ontology-derived fields (LASDONT)
  @Column({ type: 'jsonb', nullable: true })
  strengths: {
    visual?: boolean;
    auditive?: boolean;
    logical?: boolean;
    motor?: boolean;
    sensory?: boolean;
  };

  @Column({ type: 'jsonb', nullable: true })
  weaknesses: {
    visual?: boolean;
    auditive?: boolean;
    logical?: boolean;
    motor?: boolean;
    sensory?: boolean;
  };

  // Sensory / UI preferences
  @Column({ type: 'jsonb', nullable: true })
  uiPreferences: {
    lowStimulation?: boolean;
    highContrast?: boolean;
    fontSize?: 'small' | 'medium' | 'large';
    animationsEnabled?: boolean;
    soundEnabled?: boolean;
    preferredModality?: 'visual' | 'auditive' | 'mixed';
  };

  // BKT skill mastery map: { skillCode: masteryProbability }
  @Column({ type: 'jsonb', nullable: true })
  skillMastery: Record<string, number>;

  // BNCC progress
  @Column({ type: 'jsonb', nullable: true })
  bnccProgress: Record<string, {
    attempted: number;
    mastered: boolean;
    lastAttempt: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  ontologyInstanceData: Record<string, any>;

  @Column({ default: 0 })
  totalPoints: number;

  @Column({ default: 1 })
  currentLevel: number;

  @Column({ default: 0 })
  currentStreak: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}