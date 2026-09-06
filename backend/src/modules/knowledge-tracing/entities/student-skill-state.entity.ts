import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('student_skill_states')
export class StudentSkillState {
  @PrimaryColumn({ type: 'uuid' })
  studentId: string;

  @PrimaryColumn({ type: 'uuid' })
  skillId: string;

  @Column({ type: 'double precision' })
  masteryProbability: number;

  @Column({ type: 'integer', default: 0 })
  observations: number;

  @UpdateDateColumn({ type: 'timestamptz' })
  lastUpdatedAt: Date;
}
