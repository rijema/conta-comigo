import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum ProfessionalFeedbackRating {
  ADEQUATE = 'ADEQUATE',
  PARTIALLY_ADEQUATE = 'PARTIALLY_ADEQUATE',
  INADEQUATE = 'INADEQUATE',
}

@Entity('professional_recommendation_feedback')
@Index(['transitionId', 'professionalId'], { unique: true })
export class ProfessionalRecommendationFeedback {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) transitionId: string;
  @Column({ type: 'uuid' }) recommendationId: string;
  @Column() sessionId: string;
  @Column({ type: 'uuid' }) studentId: string;
  @Column({ type: 'uuid' }) professionalId: string;
  @Column({ type: 'enum', enum: ProfessionalFeedbackRating, enumName: 'professional_feedback_rating_enum' })
  rating: ProfessionalFeedbackRating;
  @Column({ type: 'jsonb', default: [] }) reasonCodes: string[];
  @Column({ type: 'text', nullable: true }) optionalComment: string | null;
  @CreateDateColumn() createdAt: Date;
}
