import { IsArray, IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ProfessionalFeedbackRating } from '../entities/professional-recommendation-feedback.entity';

export const PROFESSIONAL_FEEDBACK_REASON_CODES = [
  'difficulty_too_easy', 'difficulty_too_hard', 'interaction_format_inadequate',
  'motor_demand_inadequate', 'sensory_load_inadequate', 'language_load_inadequate',
  'skill_target_inadequate', 'child_preferred_another_format',
  'insufficient_information', 'other',
] as const;

export class CreateProfessionalFeedbackDto {
  @IsEnum(ProfessionalFeedbackRating) rating: ProfessionalFeedbackRating;
  @IsOptional() @IsArray() @IsIn(PROFESSIONAL_FEEDBACK_REASON_CODES, { each: true })
  reasonCodes?: string[];
  @IsOptional() @IsString() @MaxLength(2000) optionalComment?: string;
}
