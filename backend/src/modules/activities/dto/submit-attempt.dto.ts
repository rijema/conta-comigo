import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsObject,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitAttemptDto {
  @ApiProperty()
  @IsString()
  activityId: string;

  @ApiProperty()
  @IsOptional()
  answer: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  recommendationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  reviewAssignmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  timeSpentSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  responseTimeMs?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  firstInteractionMs?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalTimeMs?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  previousDifficulty?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  hintsUsed?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  interactionSignals?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  adeDecisionContext?: Record<string, any>;
}
