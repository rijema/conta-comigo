import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AttendanceStatus {
  ACTIVE = 'active',
  ENDED = 'ended',
}

/**
 * Tracks a professional "entering" a child's experience to run a live
 * session ("atendimento") without needing the child's own credentials.
 * Only one ACTIVE attendance per learner is allowed at a time so that,
 * if the browser/tab closes abruptly, the professional can resume (or
 * discard) that same attendance the next time they open the site.
 */
@Entity('attendances')
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  learnerId: string;

  @Column()
  professionalId: string;

  @Column({ type: 'enum', enum: AttendanceStatus, default: AttendanceStatus.ACTIVE })
  status: AttendanceStatus;

  @Column({ type: 'timestamp' })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastResumedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
