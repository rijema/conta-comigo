Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { UserRole } from '../enums/user-role.enum';
import { ChildProfile } from './child-profile.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.GUARDIAN })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  lgpdConsentGiven: boolean;

  @Column({ nullable: true })
  lgpdConsentDate: Date;

  @Column({ default: 'pt-BR' })
  language: string;

  @Column({ type: 'jsonb', nullable: true })
  preferences: Record<string, any>;

  @OneToOne(() => ChildProfile, (profile) => profile.user, {
    cascade: true,
    nullable: true,
  })
  childProfile?: ChildProfile;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}